/**
 * Seeder de Savvi — `npm run seed`
 *
 * Puebla la base de datos con un escenario completo y coherente:
 * usuarios, cuentas, categorías, ~2 años de transacciones, presupuestos,
 * deudas con abonos, plantillas de transferencia, recordatorios, adjuntos,
 * jobs de IA y lista de espera (~5.000 registros en total).
 *
 * - Es determinista: la misma semilla produce siempre los mismos datos.
 * - Es repetible: antes de insertar borra lo que sembró la corrida anterior
 *   (usuarios con dominio `@savvi.demo`), así nunca duplica.
 * - `npm run seed -- --purge` vacía TODAS las tablas antes de sembrar.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { In, Like } from 'typeorm';

import { AppDataSource } from '../config/typeorm.config';
import { bucket } from '../infrastructure/config/s3.config';
import { User } from '../auth/entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Document } from '../transactions/entities/document.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { BudgetDetail } from '../budgets/entities/budget-detail.entity';
import { Debt } from '../payment-planner/entities/debt.entity';
import { DebtPayment } from '../payment-planner/entities/debt-payment.entity';
import { TransferTemplate } from '../transfer-templates/entities/transfer-template.entity';
import { Reminder } from '../transfer-templates/entities/reminder.entity';
import { WaitingList } from '../waitinglist/entities/waiting-list.entity';
import { AiRegisterJob } from '../ai-register/entities/ai-register-job.entity';

import {
  SEED_EMAIL_DOMAIN,
  SEED_PASSWORD,
  USER_PROFILES,
  WAITING_LIST_NAMES,
  WAITING_LIST_REASONS,
} from './catalog';
import {
  MONTHS_OF_HISTORY,
  buildAccounts,
  buildAiJobs,
  buildBudgets,
  buildCategories,
  buildDebts,
  buildTransactions,
  buildTransferTemplates,
  computeBalance,
  debtPaymentTransactions,
  type TransactionPlan,
} from './generators';
import {
  addDays,
  chunk,
  intBetween,
  pick,
  pickMany,
  resetRandom,
} from './random';

/** Tamaño de lote para las inserciones masivas. */
const BATCH_SIZE = 500;

/** Categorías cuyas transacciones suelen tener factura adjunta. */
const ATTACHABLE_CATEGORIES = [
  'Salud',
  'Servicios Públicos',
  'Educación',
  'Tecnología',
  'Hogar',
  'Viajes',
  'Seguros',
];

/** Adjuntos por usuario. */
const DOCUMENTS_PER_USER = 25;

const counters: Record<string, number> = {};

function count(label: string, value: number): void {
  counters[label] = (counters[label] ?? 0) + value;
}

function log(message: string): void {
  console.log(message);
}

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

/** Vacía TODAS las tablas del dominio (solo con `--purge`). */
async function purgeEverything(): Promise<void> {
  const schema =
    (AppDataSource.options as { schema?: string }).schema ?? 'public';
  const tables = [
    'documents',
    'ai_register_jobs',
    'reminders',
    'transfer_templates',
    'debt_payments',
    'debts',
    'budget_details',
    'budgets',
    'transactions',
    'categories',
    'accounts',
    'waiting_list',
    'users',
  ]
    .map((table) => `"${schema}"."${table}"`)
    .join(', ');

  await AppDataSource.query(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`,
  );
  log('🧨  Tablas vaciadas por completo (--purge)');
}

/**
 * Borra únicamente lo sembrado por corridas anteriores.
 * Los datos reales que existan en la base quedan intactos.
 */
async function removePreviousSeed(): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const transactionRepo = AppDataSource.getRepository(Transaction);
  const documentRepo = AppDataSource.getRepository(Document);
  const aiJobRepo = AppDataSource.getRepository(AiRegisterJob);
  const waitingRepo = AppDataSource.getRepository(WaitingList);

  const previous = await userRepo.find({
    where: { email: Like(`%@${SEED_EMAIL_DOMAIN}`) },
    select: ['id'],
  });

  if (previous.length) {
    const userIds = previous.map((user) => user.id);

    // documents y ai_register_jobs no tienen FK con cascada: se borran a mano.
    const transactions = await transactionRepo.find({
      where: { userId: In(userIds) },
      select: ['id'],
    });
    for (const block of chunk(
      transactions.map((tx) => tx.id),
      BATCH_SIZE,
    )) {
      await documentRepo.delete({ module: 'transactions', refId: In(block) });
    }
    await aiJobRepo.delete({ userId: In(userIds) });

    // El resto cae por ON DELETE CASCADE desde users.
    await userRepo.delete({ id: In(userIds) });
    log(
      `🧹  Datos de la corrida anterior eliminados (${previous.length} usuarios)`,
    );
  }

  await waitingRepo.delete({ email: Like(`%@${SEED_EMAIL_DOMAIN}`) });
}

// ---------------------------------------------------------------------------
// Siembra
// ---------------------------------------------------------------------------

async function seedUser(profileIndex: number, today: Date): Promise<void> {
  const profile = USER_PROFILES[profileIndex];

  const userRepo = AppDataSource.getRepository(User);
  const accountRepo = AppDataSource.getRepository(Account);
  const categoryRepo = AppDataSource.getRepository(Category);
  const transactionRepo = AppDataSource.getRepository(Transaction);
  const documentRepo = AppDataSource.getRepository(Document);
  const budgetRepo = AppDataSource.getRepository(Budget);
  const budgetDetailRepo = AppDataSource.getRepository(BudgetDetail);
  const debtRepo = AppDataSource.getRepository(Debt);
  const debtPaymentRepo = AppDataSource.getRepository(DebtPayment);
  const templateRepo = AppDataSource.getRepository(TransferTemplate);
  const reminderRepo = AppDataSource.getRepository(Reminder);
  const aiJobRepo = AppDataSource.getRepository(AiRegisterJob);

  // --- Usuario -------------------------------------------------------------
  const user = await userRepo.save(
    userRepo.create({
      name: profile.name,
      email: profile.email,
      password: await bcrypt.hash(SEED_PASSWORD, 10),
    }),
  );
  count('Usuarios', 1);

  // --- Planes (todo se calcula antes de tocar la base) ---------------------
  const accountSeeds = buildAccounts(profile);
  const debtPlans = buildDebts(profile, accountSeeds, today, profileIndex);
  const transactionPlans: TransactionPlan[] = [
    ...buildTransactions(profile, accountSeeds, today),
    ...debtPaymentTransactions(debtPlans),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // --- Cuentas (con saldo coherente con sus movimientos) -------------------
  const accounts = await accountRepo.save(
    accountSeeds.map((seed) =>
      accountRepo.create({
        userId: user.id,
        name: seed.name,
        icon: seed.icon,
        color: seed.color,
        description: seed.description,
        balance: computeBalance(seed, transactionPlans, today),
        isCredit: seed.isCredit ?? false,
        creditLimit: seed.creditLimit,
        aprRate: seed.aprRate,
        gracePeriodDays: seed.gracePeriodDays,
        statementDay: seed.statementDay,
        dueDay: seed.dueDay,
        minPaymentPercent: seed.minPaymentPercent,
        isActive: true,
      }),
    ),
  );
  count('Cuentas', accounts.length);
  const accountByName = new Map(
    accounts.map((account) => [account.name, account]),
  );

  // --- Categorías (primero las padre, luego las hijas) ---------------------
  const categorySeeds = buildCategories();
  const parents = await categoryRepo.save(
    categorySeeds
      .filter((seed) => !seed.parent)
      .map((seed) =>
        categoryRepo.create({
          userId: user.id,
          name: seed.name,
          type: seed.type,
          icon: seed.icon,
          color: seed.color,
          description: seed.description,
          budgetLimit: seed.budgetLimit,
          isActive: true,
          isDefault: seed.isDefault ?? false,
        }),
      ),
  );
  const categoryByName = new Map(
    parents.map((category) => [category.name, category]),
  );

  const children = await categoryRepo.save(
    categorySeeds
      .filter((seed) => seed.parent)
      .map((seed) =>
        categoryRepo.create({
          userId: user.id,
          name: seed.name,
          type: seed.type,
          icon: seed.icon,
          color: seed.color,
          description: seed.description,
          budgetLimit: seed.budgetLimit,
          isActive: true,
          isDefault: false,
          parent: categoryByName.get(seed.parent as string),
        }),
      ),
  );
  for (const category of children) categoryByName.set(category.name, category);
  count('Categorías', parents.length + children.length);

  // --- Transacciones -------------------------------------------------------
  const transactions = await transactionRepo.save(
    transactionPlans.map((plan) =>
      transactionRepo.create({
        userId: user.id,
        date: plan.date,
        type: plan.type,
        amount: plan.amount,
        category: plan.category,
        account: plan.account,
        description: plan.description,
      }),
    ),
    { chunk: BATCH_SIZE },
  );
  count('Transacciones', transactions.length);

  // Enlace abono de deuda → transacción creada.
  const transactionIdByRef = new Map<string, string>();
  transactionPlans.forEach((plan, index) => {
    if (plan.debtPaymentRef)
      transactionIdByRef.set(plan.debtPaymentRef, transactions[index].id);
  });

  // --- Deudas y abonos -----------------------------------------------------
  const debts = await debtRepo.save(
    debtPlans.map((plan) =>
      debtRepo.create({
        userId: user.id,
        name: plan.name,
        payee: plan.payee,
        totalAmount: plan.totalAmount,
        remainingAmount: plan.remainingAmount,
        dueDate: plan.dueDate,
        accountId: accountByName.get(plan.accountName)?.id ?? null,
        notes: plan.notes,
        isRecurring: plan.isRecurring,
        recurrenceType: plan.recurrenceType,
        recurrenceDay: plan.recurrenceDay,
        status: plan.status,
      }),
    ),
  );
  count('Deudas', debts.length);

  const payments = debtPlans.flatMap((plan, index) =>
    plan.payments.map((payment) =>
      debtPaymentRepo.create({
        debtId: debts[index].id,
        amount: payment.amount,
        paidAt: payment.paidAt,
        transactionId: transactionIdByRef.get(payment.ref) ?? null,
      }),
    ),
  );
  if (payments.length) {
    await debtPaymentRepo.save(payments, { chunk: BATCH_SIZE });
    count('Abonos a deudas', payments.length);
  }

  // --- Presupuestos y partidas --------------------------------------------
  const budgetPlans = buildBudgets(transactionPlans, today).filter((plan) =>
    categoryByName.has(plan.categoryName),
  );

  const budgets = await budgetRepo.save(
    budgetPlans.map((plan) =>
      budgetRepo.create({
        categoryId: categoryByName.get(plan.categoryName)!.id,
        amount: plan.amount,
        amountAutoCalculated: plan.amountAutoCalculated,
        period: 'monthly',
        year: plan.year,
        month: plan.month,
        isActive: plan.isActive,
      }),
    ),
    { chunk: BATCH_SIZE },
  );
  count('Presupuestos', budgets.length);

  const details = budgetPlans.flatMap((plan, index) =>
    plan.details.map((detail) =>
      budgetDetailRepo.create({
        budgetId: budgets[index].id,
        label: detail.label,
        description: detail.description,
        estimatedAmount: detail.estimatedAmount,
        sortOrder: detail.sortOrder,
      }),
    ),
  );
  if (details.length) {
    await budgetDetailRepo.save(details, { chunk: BATCH_SIZE });
    count('Partidas de presupuesto', details.length);
  }

  // --- Plantillas de transferencia y recordatorios -------------------------
  const templatePlans = buildTransferTemplates(profile, accountSeeds, today);
  const templates = await templateRepo.save(
    templatePlans.map((plan) =>
      templateRepo.create({
        userId: user.id,
        fromAccountId: accountByName.get(plan.fromAccountName)!.id,
        name: plan.name,
        payeeName: plan.payeeName,
        payeeAccount: plan.payeeAccount,
        payeeBank: plan.payeeBank,
        lastAmount: plan.lastAmount,
        recurrenceType: plan.recurrenceType,
        frequency: plan.frequency,
        dayOfMonth: plan.dayOfMonth,
        customIntervalDays: plan.customIntervalDays,
        nextDueDate: plan.nextDueDate,
        isActive: plan.isActive,
      }),
    ),
  );
  count('Plantillas de transferencia', templates.length);

  const reminders = templatePlans.flatMap((plan, index) =>
    plan.reminders.map((reminder) =>
      reminderRepo.create({
        templateId: templates[index].id,
        scheduledAt: reminder.scheduledAt,
        sentAt: reminder.sentAt,
        status: reminder.status,
      }),
    ),
  );
  await reminderRepo.save(reminders, { chunk: BATCH_SIZE });
  count('Recordatorios', reminders.length);

  // --- Adjuntos ------------------------------------------------------------
  // Nota: son registros de ejemplo; los objetos no existen en el bucket real,
  // así que las URLs prefirmadas de descarga responderán 404.
  const attachable = transactions.filter((tx, index) =>
    ATTACHABLE_CATEGORIES.includes(transactionPlans[index].category),
  );
  const documents = pickMany(attachable, DOCUMENTS_PER_USER).map((tx) => {
    const slug = tx.category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-');
    const name = `factura-${slug}-${tx.date.toISOString().slice(0, 7)}.pdf`;
    return documentRepo.create({
      name,
      size: intBetween(80_000, 2_400_000),
      bucket,
      keyS3: `transactions/${tx.id}/${tx.date.getTime()}-${name}`,
      module: 'transactions',
      refId: tx.id,
    });
  });
  await documentRepo.save(documents, { chunk: BATCH_SIZE });
  count('Documentos adjuntos', documents.length);

  // --- Jobs de registro con IA --------------------------------------------
  const aiJobs = buildAiJobs(transactionPlans, today).map((plan) =>
    aiJobRepo.create({
      userId: user.id,
      fileKey: plan.fileKey,
      fileName: plan.fileName,
      fileSize: plan.fileSize,
      mimeType: plan.mimeType,
      userText: plan.userText,
      status: plan.status,
      error: plan.error,
      extractedPayload: plan.extractedPayload ?? undefined,
      createdTransactionId:
        plan.transactionIndex !== null
          ? transactions[plan.transactionIndex].id
          : undefined,
    }),
  );
  await aiJobRepo.save(aiJobs);
  count('Jobs de IA', aiJobs.length);

  const ingresos = transactionPlans.filter(
    (tx) => tx.type === 'ingreso',
  ).length;
  log(
    `   ✔ ${profile.name.padEnd(20)} ${String(transactions.length).padStart(5)} transacciones ` +
      `(${ingresos} ingresos / ${transactions.length - ingresos} egresos)`,
  );
}

async function seedWaitingList(today: Date): Promise<void> {
  const repo = AppDataSource.getRepository(WaitingList);

  const rows = WAITING_LIST_NAMES.map((name) =>
    repo.create({
      email: `${name}@${SEED_EMAIL_DOMAIN}`,
      description: pick(WAITING_LIST_REASONS),
      createdAt: addDays(today, -intBetween(1, 180)),
    }),
  );

  await repo.save(rows, { chunk: BATCH_SIZE });
  count('Lista de espera', rows.length);
}

// ---------------------------------------------------------------------------
// Orquestador
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const purge = process.argv.includes('--purge');
  const started = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  resetRandom();

  await AppDataSource.initialize();

  const options = AppDataSource.options as { database?: string; host?: string };
  log('');
  log('🌱  Savvi — seeder de datos de ejemplo');
  log(`    Base de datos: ${options.database ?? '?'} @ ${options.host ?? '?'}`);
  log(
    `    Historial: ${MONTHS_OF_HISTORY} meses · Usuarios: ${USER_PROFILES.length}`,
  );
  log('');

  try {
    if (purge) {
      await purgeEverything();
    } else {
      await removePreviousSeed();
    }

    for (let i = 0; i < USER_PROFILES.length; i++) {
      await seedUser(i, today);
    }

    await seedWaitingList(today);

    const total = Object.values(counters).reduce(
      (sum, value) => sum + value,
      0,
    );
    const width = Math.max(...Object.keys(counters).map((key) => key.length));

    log('');
    log('📊  Resumen');
    for (const [label, value] of Object.entries(counters)) {
      log(`    ${label.padEnd(width)}  ${String(value).padStart(6)}`);
    }
    log(`    ${'TOTAL'.padEnd(width)}  ${String(total).padStart(6)}`);
    log('');
    log(`🔑  Usuarios de prueba (contraseña: ${SEED_PASSWORD})`);
    for (const profile of USER_PROFILES) {
      log(`    ${profile.email.padEnd(38)} ${profile.occupation}`);
    }
    log('');
    log(`✅  Listo en ${((Date.now() - started) / 1000).toFixed(1)}s`);
    log('');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('');
  console.error(
    '❌  El seeder falló:',
    error instanceof Error ? error.message : error,
  );
  console.error('');
  console.error(
    '    Revisa que la base exista y que las migraciones estén aplicadas:',
  );
  console.error('    npm run migration:run');
  console.error('');
  process.exit(1);
});
