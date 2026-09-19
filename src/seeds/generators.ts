/**
 * Construcción de los datos de cada usuario.
 *
 * Los generadores devuelven "planes" (objetos planos). El orquestador
 * (`seed.ts`) los persiste en orden y va enlazando los IDs reales.
 */
import {
  ACCOUNT_CATALOG,
  AI_JOB_ERRORS,
  AI_JOB_SAMPLES,
  CATEGORY_CATALOG,
  DEBT_CATALOG,
  MERCHANT_CATALOG,
  RECURRING_CATALOG,
  TRANSFER_TEMPLATE_CATALOG,
  type AccountSeed,
  type CategorySeed,
  type UserProfileSeed,
} from './catalog';
import {
  addDays,
  addMonths,
  chance,
  dateOf,
  intBetween,
  isSameOrBefore,
  moneyBetween,
  monthKey,
  pick,
  pickMany,
  pickWeighted,
  random,
  startOfMonth,
} from './random';

/** Meses de historial que se generan hacia atrás desde hoy. */
export const MONTHS_OF_HISTORY = 24;
/** Meses de presupuestos (los más recientes). */
export const MONTHS_OF_BUDGETS = 6;

export type TransactionPlan = {
  date: Date;
  type: 'ingreso' | 'egreso';
  amount: number;
  category: string;
  account: string;
  description: string;
  /** Marca interna para enlazar abonos de deuda con su transacción. */
  debtPaymentRef?: string;
};

export type DebtPaymentPlan = {
  ref: string;
  amount: number;
  paidAt: Date;
};

export type DebtPlan = {
  name: string;
  payee: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: Date;
  accountName: string;
  notes: string;
  isRecurring: boolean;
  recurrenceType: 'monthly' | 'biweekly' | null;
  recurrenceDay: number | null;
  status: 'pending' | 'paid';
  payments: DebtPaymentPlan[];
};

export type ReminderPlan = {
  scheduledAt: Date;
  sentAt: Date | null;
  status: 'scheduled' | 'sent' | 'dismissed';
};

export type TransferTemplatePlan = {
  name: string;
  payeeName: string;
  payeeAccount: string;
  payeeBank: string;
  lastAmount: number;
  recurrenceType: 'reminder' | 'automatic';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'custom';
  dayOfMonth: number;
  customIntervalDays: number | null;
  nextDueDate: Date;
  isActive: boolean;
  fromAccountName: string;
  reminders: ReminderPlan[];
};

export type BudgetDetailPlan = {
  label: string;
  description: string;
  estimatedAmount: number;
  sortOrder: number;
};

export type BudgetPlan = {
  categoryName: string;
  amount: number;
  amountAutoCalculated: boolean;
  year: number;
  month: number;
  isActive: boolean;
  details: BudgetDetailPlan[];
};

export type AiJobPlan = {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userText: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error: string | null;
  extractedPayload: Record<string, unknown> | null;
  /** Índice de la transacción del usuario que generó el job (si status = completed). */
  transactionIndex: number | null;
};

// ---------------------------------------------------------------------------
// Cuentas y categorías
// ---------------------------------------------------------------------------

export function buildAccounts(profile: UserProfileSeed): AccountSeed[] {
  return profile.accounts.map((key) => ACCOUNT_CATALOG[key]);
}

export function buildCategories(): CategorySeed[] {
  return CATEGORY_CATALOG;
}

// ---------------------------------------------------------------------------
// Transacciones
// ---------------------------------------------------------------------------

/** Cuenta preferida para un gasto, cayendo a la primera disponible del perfil. */
function resolveAccount(accounts: AccountSeed[], prefer?: string[]): string {
  if (prefer) {
    const matches = accounts.filter((a) => prefer.includes(a.name));
    if (matches.length) return pick(matches).name;
  }
  const debit = accounts.filter((a) => !a.isCredit);
  return pick(debit.length ? debit : accounts).name;
}

/** Gastos grandes tienden a ir a la tarjeta de crédito, como en la vida real. */
function resolveAccountForAmount(
  accounts: AccountSeed[],
  amount: number,
  prefer?: string[],
): string {
  const credit = accounts.find((a) => a.isCredit);
  if (credit && amount > 250_000 && chance(0.55)) return credit.name;
  if (credit && amount > 80_000 && chance(0.2)) return credit.name;
  return resolveAccount(accounts, prefer);
}

/**
 * Los pagos recurrentes salen de una cuenta bancaria (nadie paga el internet en
 * efectivo) y las suscripciones se cargan a la tarjeta cuando el perfil la tiene.
 */
function resolveRecurringAccount(
  accounts: AccountSeed[],
  seed: { category: string; prefer?: string[] },
): string {
  if (seed.category === 'Suscripciones') {
    const credit = accounts.find((account) => account.isCredit);
    if (credit) return credit.name;
  }

  const bank = accounts.filter(
    (account) => !account.isCredit && account.name !== 'Efectivo',
  );
  return resolveAccount(bank.length ? bank : accounts, seed.prefer);
}

function jitter(base: number, spread: number): number {
  const value = base * (1 + (random() * 2 - 1) * spread);
  return Math.round(value / 100) * 100;
}

/** Monto de un movimiento recurrente derivado del perfil. */
function recurringAmount(profile: UserProfileSeed, key: string): number {
  switch (key) {
    case 'salarioMensual':
      return jitter(profile.monthlyIncome, 0.02);
    case 'salarioQuincenal':
      return jitter(profile.monthlyIncome / 2, 0.02);
    case 'arriendo':
      return Math.round((profile.monthlyIncome * 0.28) / 10_000) * 10_000;
    case 'ahorro':
      return Math.round((profile.monthlyIncome * 0.08) / 10_000) * 10_000;
    default: {
      const seed = RECURRING_CATALOG[key];
      return moneyBetween(seed.min, seed.max);
    }
  }
}

function describeRecurring(
  seed: { label: string; note: string },
  date: Date,
): string {
  const mes = date.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });
  return `${seed.label} — ${seed.note} (${mes})`;
}

export function buildTransactions(
  profile: UserProfileSeed,
  accounts: AccountSeed[],
  today: Date,
): TransactionPlan[] {
  const transactions: TransactionPlan[] = [];
  const firstMonth = startOfMonth(addMonths(today, -(MONTHS_OF_HISTORY - 1)));
  const availableCategories = new Set(CATEGORY_CATALOG.map((c) => c.name));
  const mainAccount =
    accounts.find((a) => !a.isCredit)?.name ?? accounts[0].name;
  const creditAccount = accounts.find((a) => a.isCredit);
  const isMerchantProfile = profile.occupation
    .toLowerCase()
    .includes('comerciante');

  const push = (plan: TransactionPlan) => {
    if (isSameOrBefore(plan.date, today)) transactions.push(plan);
  };

  // --- Movimientos recurrentes mes a mes -----------------------------------
  for (let i = 0; i < MONTHS_OF_HISTORY; i++) {
    const cursor = addMonths(firstMonth, i);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    for (const key of profile.recurring) {
      // El pago de la tarjeta se calcula al final, cuando ya se conoce el consumo.
      if (key === 'pagoTarjeta') continue;

      const seed = RECURRING_CATALOG[key];
      if (!availableCategories.has(seed.category)) continue;

      const days =
        seed.frequency === 'biweekly' ? [seed.day, seed.day + 15] : [seed.day];
      for (const day of days) {
        push({
          date: dateOf(year, month, day),
          type: seed.type,
          amount: recurringAmount(profile, key),
          category: seed.category,
          account:
            seed.type === 'ingreso'
              ? mainAccount
              : resolveRecurringAccount(accounts, seed),
          description: describeRecurring(seed, cursor),
        });
      }
    }

    // Ventas semanales para el perfil comerciante (reemplaza la nómina).
    if (isMerchantProfile) {
      for (const day of [6, 13, 20, 27]) {
        push({
          date: dateOf(year, month, day),
          type: 'ingreso',
          amount: jitter(profile.monthlyIncome / 4, 0.22),
          category: 'Ventas',
          account: chance(0.6) ? mainAccount : 'Efectivo',
          description: 'Cierre de ventas de la semana en la tienda',
        });
      }
    }

    // Ingresos extra esporádicos.
    for (const extra of profile.extraIncome) {
      if (extra.category === 'Ventas' && isMerchantProfile) continue;
      if (!chance(extra.chance)) continue;
      push({
        date: dateOf(year, month, intBetween(2, 27)),
        type: 'ingreso',
        amount: moneyBetween(extra.min, extra.max),
        category: extra.category,
        account: mainAccount,
        description: `${extra.label} — pago recibido`,
      });
    }
  }

  // --- Gasto variable hasta alcanzar el objetivo del perfil ----------------
  const merchants = MERCHANT_CATALOG.filter((m) =>
    availableCategories.has(m.category),
  );
  const totalDays = Math.round(
    (today.getTime() - firstMonth.getTime()) / 86_400_000,
  );

  while (transactions.length < profile.transactionsTarget) {
    const merchant = pickWeighted(merchants);
    let date = addDays(firstMonth, intBetween(0, totalDays));

    // Restaurantes y planes se concentran en fin de semana.
    const weekendish =
      merchant.category === 'Restaurantes' ||
      merchant.category === 'Entretenimiento';
    if (weekendish && date.getDay() > 0 && date.getDay() < 5 && chance(0.6)) {
      date = addDays(date, 5 - date.getDay());
    }
    if (!isSameOrBefore(date, today)) continue;

    const amount = Math.max(
      1_000,
      Math.round(
        (moneyBetween(merchant.min, merchant.max) * profile.spendingScale) /
          100,
      ) * 100,
    );

    transactions.push({
      date,
      type: 'egreso',
      amount,
      category: merchant.category,
      account: resolveAccountForAmount(accounts, amount, merchant.prefer),
      description: `${merchant.name} — ${merchant.note}`,
    });
  }

  // --- Pago mensual de la tarjeta de crédito -------------------------------
  // Se paga, el mes siguiente, lo consumido con la tarjeta en el mes anterior.
  if (creditAccount && profile.recurring.includes('pagoTarjeta')) {
    const chargesByMonth = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.account !== creditAccount.name || tx.type !== 'egreso') continue;
      const key = monthKey(tx.date);
      chargesByMonth.set(key, (chargesByMonth.get(key) ?? 0) + tx.amount);
    }

    for (let i = 0; i < MONTHS_OF_HISTORY; i++) {
      const cursor = addMonths(firstMonth, i);
      const charges = chargesByMonth.get(monthKey(cursor)) ?? 0;
      if (charges < 50_000) continue;

      // Unas veces se paga todo, otras un abono parcial (como en la realidad).
      const paid = chance(0.75)
        ? charges
        : Math.round((charges * (0.3 + random() * 0.4)) / 100) * 100;
      push({
        date: dateOf(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          RECURRING_CATALOG.pagoTarjeta.day,
        ),
        type: 'egreso',
        amount: paid,
        category: 'Deudas',
        account: mainAccount,
        description: `Pago ${creditAccount.name} — facturación de ${cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
      });
    }
  }

  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return transactions;
}

/**
 * Saldo actual de la cuenta.
 *
 * `balance` es el saldo que declara el usuario: el backend nunca lo recalcula a
 * partir de las transacciones (ver AccountsService). Por eso NO se acumulan los
 * 24 meses de historia — eso dejaría la cuenta de nómina con cientos de millones
 * y las secundarias en negativo, porque los traslados entre cuentas propias no
 * se registran como movimientos. Se usa el flujo del último mes sobre un colchón
 * base, que es lo que de verdad muestra un extracto.
 *
 * En las tarjetas de crédito el saldo es la deuda del ciclo vigente (negativo).
 */
export function computeBalance(
  account: AccountSeed,
  transactions: TransactionPlan[],
  today: Date,
): number {
  const own = transactions.filter((tx) => tx.account === account.name);

  if (account.isCredit) {
    const cycleStart = addDays(today, -35);
    const debt = own
      .filter((tx) => tx.type === 'egreso' && tx.date >= cycleStart)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return -Math.round(debt / 100) * 100;
  }

  const monthStart = addDays(today, -30);
  const flow = own
    .filter((tx) => tx.date >= monthStart)
    .reduce(
      (sum, tx) => sum + (tx.type === 'ingreso' ? tx.amount : -tx.amount),
      0,
    );

  // Piso positivo: una cuenta de ahorros o el efectivo nunca quedan en rojo.
  const balance = Math.max(
    account.initialBalance * 0.35,
    account.initialBalance + flow,
  );
  return Math.round(balance / 100) * 100;
}

// ---------------------------------------------------------------------------
// Presupuestos
// ---------------------------------------------------------------------------

export function buildBudgets(
  transactions: TransactionPlan[],
  today: Date,
): BudgetPlan[] {
  // Gasto promedio mensual por categoría → el presupuesto queda pegado a la realidad.
  const spendByCategory = new Map<string, number>();
  const months = new Set<string>();
  for (const tx of transactions) {
    if (tx.type !== 'egreso') continue;
    months.add(monthKey(tx.date));
    spendByCategory.set(
      tx.category,
      (spendByCategory.get(tx.category) ?? 0) + tx.amount,
    );
  }

  const monthCount = Math.max(1, months.size);
  const ranked = [...spendByCategory.entries()]
    .map(([name, total]) => ({ name, average: total / monthCount }))
    .filter((row) => row.average > 50_000)
    .sort((a, b) => b.average - a.average)
    .slice(0, 6);

  // Servicios Públicos siempre entra: es el presupuesto que se arma por partidas.
  const services = spendByCategory.get('Servicios Públicos');
  if (services && !ranked.some((row) => row.name === 'Servicios Públicos')) {
    ranked[ranked.length - 1] = {
      name: 'Servicios Públicos',
      average: services / monthCount,
    };
  }

  const budgets: BudgetPlan[] = [];

  for (let i = 0; i < MONTHS_OF_BUDGETS; i++) {
    const cursor = addMonths(startOfMonth(today), -i);
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    for (const row of ranked) {
      const amount =
        Math.round((row.average * (1.05 + random() * 0.2)) / 10_000) * 10_000;

      // Servicios públicos se presupuesta por partidas y se autocalcula.
      if (row.name === 'Servicios Públicos') {
        const details: BudgetDetailPlan[] = [
          {
            label: 'Energía y agua',
            description: 'Factura EPM',
            estimatedAmount: Math.round(amount * 0.45),
            sortOrder: 0,
          },
          {
            label: 'Gas natural',
            description: 'Factura Vanti',
            estimatedAmount: Math.round(amount * 0.1),
            sortOrder: 1,
          },
          {
            label: 'Internet y TV',
            description: 'Plan hogar Claro',
            estimatedAmount: Math.round(amount * 0.28),
            sortOrder: 2,
          },
          {
            label: 'Plan celular',
            description: 'Movistar pospago',
            estimatedAmount: Math.round(amount * 0.17),
            sortOrder: 3,
          },
        ];
        budgets.push({
          categoryName: row.name,
          amount: details.reduce((sum, d) => sum + d.estimatedAmount, 0),
          amountAutoCalculated: true,
          year,
          month,
          isActive: true,
          details,
        });
        continue;
      }

      budgets.push({
        categoryName: row.name,
        amount,
        amountAutoCalculated: false,
        year,
        month,
        isActive: true,
        details: [],
      });
    }
  }

  return budgets;
}

// ---------------------------------------------------------------------------
// Deudas
// ---------------------------------------------------------------------------

export function buildDebts(
  profile: UserProfileSeed,
  accounts: AccountSeed[],
  today: Date,
  userIndex: number,
): DebtPlan[] {
  const chosen = pickMany(DEBT_CATALOG, 4);

  return chosen.map((seed, debtIndex) => {
    const totalAmount =
      Math.round(
        (moneyBetween(seed.min, seed.max) * profile.spendingScale) / 1_000,
      ) * 1_000;
    const accountName = resolveAccount(accounts);

    // Entre 0 y 4 abonos ya registrados.
    const paymentCount = intBetween(0, 4);
    const payments: DebtPaymentPlan[] = [];
    let paid = 0;

    for (let i = 0; i < paymentCount; i++) {
      const remaining = totalAmount - paid;
      if (remaining <= 0) break;
      const amount = Math.min(
        remaining,
        Math.round(totalAmount / Math.max(2, paymentCount) / 1_000) * 1_000,
      );
      paid += amount;
      payments.push({
        ref: `u${userIndex}-d${debtIndex}-p${i}`,
        amount,
        paidAt: addDays(today, -((paymentCount - i) * intBetween(26, 34))),
      });
    }

    const remainingAmount = Math.max(0, totalAmount - paid);
    const dueOffset = chance(0.7) ? intBetween(3, 90) : -intBetween(1, 45);

    return {
      name: seed.name,
      payee: seed.payee,
      totalAmount,
      remainingAmount,
      dueDate: addDays(today, dueOffset),
      accountName,
      notes: seed.notes,
      isRecurring: seed.isRecurring,
      recurrenceType: seed.isRecurring
        ? (seed.recurrenceType ?? 'monthly')
        : null,
      recurrenceDay: seed.isRecurring ? intBetween(1, 28) : null,
      status: remainingAmount === 0 ? 'paid' : 'pending',
      payments,
    };
  });
}

/** Cada abono de deuda deja su transacción, igual que hace el endpoint real. */
export function debtPaymentTransactions(debts: DebtPlan[]): TransactionPlan[] {
  const plans: TransactionPlan[] = [];
  for (const debt of debts) {
    for (const payment of debt.payments) {
      plans.push({
        date: payment.paidAt,
        type: 'egreso',
        amount: payment.amount,
        category: 'Deudas',
        account: debt.accountName,
        description: `Abono a ${debt.name} — ${debt.payee}`,
        debtPaymentRef: payment.ref,
      });
    }
  }
  return plans;
}

// ---------------------------------------------------------------------------
// Plantillas de transferencia y recordatorios
// ---------------------------------------------------------------------------

function nextDueFrom(
  today: Date,
  dayOfMonth: number,
  frequency: string,
  interval: number | null,
): Date {
  if (frequency === 'custom' && interval)
    return addDays(today, intBetween(1, interval));

  const thisMonth = dateOf(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (thisMonth > today) return thisMonth;

  const step = frequency === 'bimonthly' ? 2 : 1;
  const next = addMonths(thisMonth, step);
  return dateOf(next.getFullYear(), next.getMonth(), dayOfMonth);
}

function reminderStep(frequency: string, interval: number | null): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 15;
    case 'bimonthly':
      return 60;
    case 'custom':
      return interval ?? 30;
    default:
      return 30;
  }
}

export function buildTransferTemplates(
  profile: UserProfileSeed,
  accounts: AccountSeed[],
  today: Date,
): TransferTemplatePlan[] {
  const chosen = pickMany(TRANSFER_TEMPLATE_CATALOG, 4);

  return chosen.map((seed, index) => {
    const interval = seed.customIntervalDays ?? null;
    // La primera plantilla de cada usuario vence hoy: así `GET /reminders`
    // (que solo lista las plantillas que vencen en la fecha actual) trae datos.
    const dueToday = index === 0;
    const nextDueDate = dueToday
      ? today
      : nextDueFrom(today, seed.dayOfMonth, seed.frequency, interval);
    const step = reminderStep(seed.frequency, interval);

    // Historial de recordatorios: los pasados ya se enviaron o se descartaron.
    const reminders: ReminderPlan[] = [];
    for (let i = 6; i >= 1; i--) {
      const scheduledAt = addDays(nextDueDate, -step * i);
      if (!isSameOrBefore(scheduledAt, today)) continue;
      const dismissed = chance(0.25);
      reminders.push({
        scheduledAt,
        sentAt: dismissed ? null : addDays(scheduledAt, 0),
        status: dismissed ? 'dismissed' : 'sent',
      });
    }
    reminders.push({
      scheduledAt: nextDueDate,
      sentAt: null,
      status: 'scheduled',
    });

    return {
      name: seed.name,
      payeeName: seed.payeeName,
      payeeAccount: `${intBetween(100, 999)}-${intBetween(100000, 999999)}-${intBetween(10, 99)}`,
      payeeBank: seed.payeeBank,
      lastAmount:
        Math.round(
          (moneyBetween(seed.min, seed.max) * profile.spendingScale) / 1_000,
        ) * 1_000,
      recurrenceType: seed.recurrenceType,
      frequency: seed.frequency,
      dayOfMonth: seed.dayOfMonth,
      customIntervalDays: interval,
      nextDueDate,
      isActive: dueToday || chance(0.85),
      fromAccountName: resolveAccount(accounts),
      reminders,
    };
  });
}

// ---------------------------------------------------------------------------
// Jobs de registro con IA
// ---------------------------------------------------------------------------

export function buildAiJobs(
  transactions: TransactionPlan[],
  today: Date,
): AiJobPlan[] {
  const statuses: AiJobPlan['status'][] = [
    'completed',
    'completed',
    'completed',
    'failed',
    'queued',
    'processing',
  ];

  return statuses.map((status, i) => {
    const sample = AI_JOB_SAMPLES[i % AI_JOB_SAMPLES.length];
    const createdAt = addDays(today, -intBetween(0, 45));

    // Para los completados se enlaza una transacción real de la misma categoría.
    let transactionIndex: number | null = null;
    let extractedPayload: Record<string, unknown> | null = null;

    if (status === 'completed') {
      const candidates = transactions
        .map((tx, index) => ({ tx, index }))
        .filter((row) => row.tx.category === sample.category);
      if (candidates.length) {
        const chosen = pick(candidates);
        transactionIndex = chosen.index;
        extractedPayload = {
          date: chosen.tx.date.toISOString().slice(0, 10),
          type: chosen.tx.type,
          amount: chosen.tx.amount,
          category: chosen.tx.category,
          account: chosen.tx.account,
          description: chosen.tx.description,
          confidence: Number((0.82 + random() * 0.17).toFixed(2)),
        };
      }
    }

    return {
      fileKey: `savvi-ia/${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(2, '0')}/${Date.now() + i}-${sample.fileName}`,
      fileName: sample.fileName,
      fileSize: intBetween(45_000, 3_800_000),
      mimeType: sample.mimeType,
      userText: sample.userText,
      status,
      error: status === 'failed' ? pick(AI_JOB_ERRORS) : null,
      extractedPayload,
      transactionIndex,
    };
  });
}
