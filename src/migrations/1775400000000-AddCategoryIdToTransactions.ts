import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Relaciona `transactions` con `categories` mediante `category_id`.
 *
 * La columna de texto `category` (nombre o, en registros viejos, el id) se
 * conserva mientras tanto, pero deja de ser obligatoria: la fuente de verdad
 * pasa a ser `category_id`. Llenado de las filas existentes, en orden:
 *  1. `category` es el id de una categoría del mismo usuario.
 *  2. `category` es el nombre (sin distinguir mayúsculas ni espacios) de una
 *     categoría del mismo usuario. Si hay nombres repetidos gana la del mismo
 *     tipo, luego la activa y luego la más antigua.
 *  3. Lo que no coincide (casi siempre pagos recurrentes, que guardaban el
 *     nombre de la plantilla) va a "Pagos recurrentes" / "Ingresos recurrentes"
 *     o a "Sin categoría", que se crean por usuario si no existen.
 */
export class AddCategoryIdToTransactions1775400000000
  implements MigrationInterface
{
  name = 'AddCategoryIdToTransactions1775400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      ADD COLUMN IF NOT EXISTS category_id uuid NULL;
    `);

    // 1. El texto ya es el id de una categoría del usuario.
    await queryRunner.query(`
      UPDATE finance.transactions t
      SET category_id = c.id
      FROM finance.categories c
      WHERE t.category_id IS NULL
        AND c.user_id = t.user_id
        AND c.id::text = lower(trim(t.category));
    `);

    // 2. El texto es el nombre de una categoría del usuario.
    await queryRunner.query(`
      UPDATE finance.transactions t
      SET category_id = m.category_id
      FROM (
        SELECT DISTINCT ON (t2.id) t2.id AS transaction_id, c.id AS category_id
        FROM finance.transactions t2
        JOIN finance.categories c
          ON c.user_id = t2.user_id
         AND lower(trim(c.name)) = lower(trim(t2.category))
        WHERE t2.category_id IS NULL
        ORDER BY
          t2.id,
          (c.type = CASE WHEN t2.type = 'ingreso' THEN 'ingreso' ELSE 'egreso' END) DESC,
          c."isActive" DESC,
          c."createdAt" ASC
      ) m
      WHERE t.id = m.transaction_id;
    `);

    // 3. Sin coincidencia: categoría de respaldo por usuario.
    await queryRunner.query(`
      CREATE TEMP TABLE tx_fallback AS
      SELECT
        t.id AS transaction_id,
        t.user_id,
        CASE
          WHEN t.description LIKE '%transfer_template_id:%' AND t.type = 'ingreso' THEN 'Ingresos recurrentes'
          WHEN t.description LIKE '%transfer_template_id:%' THEN 'Pagos recurrentes'
          ELSE 'Sin categoría'
        END AS name,
        CASE WHEN t.type = 'ingreso' THEN 'ingreso' ELSE 'egreso' END AS type
      FROM finance.transactions t
      WHERE t.category_id IS NULL;
    `);

    await queryRunner.query(`
      INSERT INTO finance.categories (user_id, name, type, "isActive", "isDefault")
      SELECT DISTINCT f.user_id, f.name, f.type, true, false
      FROM tx_fallback f
      WHERE NOT EXISTS (
        SELECT 1 FROM finance.categories c
        WHERE c.user_id = f.user_id
          AND lower(trim(c.name)) = lower(f.name)
          AND c.type = f.type
      );
    `);

    await queryRunner.query(`
      UPDATE finance.transactions t
      SET category_id = m.category_id
      FROM (
        SELECT DISTINCT ON (f.transaction_id) f.transaction_id, c.id AS category_id
        FROM tx_fallback f
        JOIN finance.categories c
          ON c.user_id = f.user_id
         AND lower(trim(c.name)) = lower(f.name)
         AND c.type = f.type
        ORDER BY f.transaction_id, c."createdAt" ASC
      ) m
      WHERE t.id = m.transaction_id;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS tx_fallback;`);

    // Toda transacción queda con categoría: la relación pasa a ser obligatoria.
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      ALTER COLUMN category_id SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE finance.transactions
      ADD CONSTRAINT "FK_transactions_category"
      FOREIGN KEY (category_id) REFERENCES finance.categories(id)
      ON DELETE RESTRICT;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_category_id"
      ON finance.transactions (category_id);
    `);

    // La columna vieja se conserva solo como referencia hasta eliminarla.
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      ALTER COLUMN category DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Las categorías de respaldo creadas en `up` se dejan: pueden tener uso nuevo.
    await queryRunner.query(`
      UPDATE finance.transactions t
      SET category = c.name
      FROM finance.categories c
      WHERE c.id = t.category_id AND t.category IS NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      ALTER COLUMN category SET NOT NULL;
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS finance."IDX_transactions_category_id";`,
    );
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      DROP CONSTRAINT IF EXISTS "FK_transactions_category";
    `);
    await queryRunner.query(`
      ALTER TABLE finance.transactions
      DROP COLUMN IF EXISTS category_id;
    `);
  }
}
