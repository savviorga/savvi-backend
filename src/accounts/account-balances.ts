import type { Account } from './entities/account.entity';

/**
 * Saldo actual de una cuenta = saldo inicial (`accounts.balance`)
 *   + ingresos − egresos − transferencias que salen + transferencias que entran.
 * Una transferencia sin cuenta destino (pago a un tercero o registro viejo)
 * solo resta en la de origen.
 */
const MOVEMENTS_SQL = `
  SELECT m.account_id AS "accountId", SUM(m.delta) AS "delta"
  FROM (
    SELECT t.account_id,
           CASE
             WHEN t.type = 'ingreso' THEN t.amount
             WHEN t.type IN ('egreso', 'transferencia') THEN -t.amount
             ELSE 0
           END AS delta
    FROM finance.transactions t
    WHERE t.user_id = $1 AND t.account_id IS NOT NULL
    UNION ALL
    SELECT t.to_account_id, t.amount
    FROM finance.transactions t
    WHERE t.user_id = $1 AND t.to_account_id IS NOT NULL
      AND t.type = 'transferencia'
  ) m
  GROUP BY m.account_id
`;

type QueryRunnerLike = {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
};

export type AccountWithBalance = Account & {
  /** Saldo inicial más los movimientos registrados en la cuenta. */
  currentBalance: number;
};

/** Neto de movimientos por cuenta del usuario (id → monto). */
export async function loadAccountMovements(
  runner: QueryRunnerLike,
  userId: string,
): Promise<Map<string, number>> {
  const rows = (await runner.query(MOVEMENTS_SQL, [userId])) as {
    accountId: string;
    delta: string | number | null;
  }[];
  return new Map(rows.map((row) => [row.accountId, Number(row.delta ?? 0)]));
}

export function currentBalanceOf(
  account: Pick<Account, 'id' | 'balance'>,
  movements: Map<string, number>,
): number {
  const total = Number(account.balance ?? 0) + (movements.get(account.id) ?? 0);
  return Math.round(total * 100) / 100;
}

export function withCurrentBalance(
  account: Account,
  movements: Map<string, number>,
): AccountWithBalance {
  return Object.assign(account, {
    currentBalance: currentBalanceOf(account, movements),
  });
}
