/**
 * Catálogo de datos base del seeder.
 *
 * Todo está pensado sobre un caso real colombiano: pesos (COP), comercios,
 * bancos y hábitos de consumo reconocibles. Los montos son los que de verdad
 * se ven en un extracto bancario, no números al azar.
 */

export const SEED_EMAIL_DOMAIN = 'savvi.demo';
export const SEED_PASSWORD = 'Savvi2026*';

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

export type AccountSeed = {
  name: string;
  icon: string;
  color: string;
  description: string;
  isCredit?: boolean;
  creditLimit?: number;
  aprRate?: number;
  gracePeriodDays?: number;
  statementDay?: number;
  dueDay?: number;
  minPaymentPercent?: number;
  initialBalance: number;
};

export const ACCOUNT_CATALOG: Record<string, AccountSeed> = {
  bancolombiaAhorros: {
    name: 'Bancolombia Ahorros',
    icon: 'piggy-bank',
    color: '#facc15',
    description: 'Cuenta de ahorros principal — nómina',
    initialBalance: 2_400_000,
  },
  davivienda: {
    name: 'Davivienda Corriente',
    icon: 'building-bank',
    color: '#ef4444',
    description: 'Cuenta corriente para pagos del hogar',
    initialBalance: 1_150_000,
  },
  bbva: {
    name: 'BBVA Ahorros',
    icon: 'building-bank',
    color: '#2563eb',
    description: 'Cuenta de ahorros secundaria',
    initialBalance: 900_000,
  },
  nequi: {
    name: 'Nequi',
    icon: 'smartphone',
    color: '#8b5cf6',
    description: 'Billetera digital para el día a día',
    initialBalance: 320_000,
  },
  daviplata: {
    name: 'Daviplata',
    icon: 'smartphone',
    color: '#f43f5e',
    description: 'Billetera digital para transferencias rápidas',
    initialBalance: 180_000,
  },
  efectivo: {
    name: 'Efectivo',
    icon: 'wallet',
    color: '#10b981',
    description: 'Dinero en efectivo',
    initialBalance: 250_000,
  },
  visaBancolombia: {
    name: 'Tarjeta Visa Bancolombia',
    icon: 'credit-card',
    color: '#0ea5e9',
    description: 'Tarjeta de crédito Visa — corte el día 15',
    isCredit: true,
    creditLimit: 12_000_000,
    aprRate: 32.4,
    gracePeriodDays: 25,
    statementDay: 15,
    dueDay: 5,
    minPaymentPercent: 5,
    initialBalance: 0,
  },
  masterFalabella: {
    name: 'Tarjeta Falabella',
    icon: 'credit-card',
    color: '#22c55e',
    description: 'Tarjeta de crédito CMR — corte el día 20',
    isCredit: true,
    creditLimit: 5_000_000,
    aprRate: 34.8,
    gracePeriodDays: 20,
    statementDay: 20,
    dueDay: 10,
    minPaymentPercent: 5,
    initialBalance: 0,
  },
};

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export type CategorySeed = {
  name: string;
  type: 'ingreso' | 'egreso';
  icon: string;
  color: string;
  description: string;
  parent?: string;
  budgetLimit?: number;
  isDefault?: boolean;
};

export const CATEGORY_CATALOG: CategorySeed[] = [
  // Ingresos
  {
    name: 'Salario',
    type: 'ingreso',
    icon: 'briefcase',
    color: '#16a34a',
    description: 'Nómina quincenal o mensual',
    isDefault: true,
  },
  {
    name: 'Freelance',
    type: 'ingreso',
    icon: 'laptop',
    color: '#22c55e',
    description: 'Proyectos independientes',
  },
  {
    name: 'Ventas',
    type: 'ingreso',
    icon: 'store',
    color: '#4ade80',
    description: 'Ventas del negocio',
  },
  {
    name: 'Arriendos',
    type: 'ingreso',
    icon: 'home',
    color: '#86efac',
    description: 'Canon de arrendamiento recibido',
  },
  {
    name: 'Bonificaciones',
    type: 'ingreso',
    icon: 'gift',
    color: '#65a30d',
    description: 'Primas, bonos y comisiones',
  },
  {
    name: 'Reembolsos',
    type: 'ingreso',
    icon: 'rotate-ccw',
    color: '#a3e635',
    description: 'Devoluciones y reembolsos',
  },
  {
    name: 'Rendimientos',
    type: 'ingreso',
    icon: 'trending-up',
    color: '#14b8a6',
    description: 'Intereses de CDT y fondos',
  },

  // Egresos principales
  {
    name: 'Alimentación',
    type: 'egreso',
    icon: 'utensils',
    color: '#f97316',
    description: 'Mercado, restaurantes y domicilios',
    isDefault: true,
    budgetLimit: 1_200_000,
  },
  {
    name: 'Mercado',
    type: 'egreso',
    icon: 'shopping-cart',
    color: '#fb923c',
    description: 'Supermercado y tienda de barrio',
    parent: 'Alimentación',
    budgetLimit: 800_000,
  },
  {
    name: 'Restaurantes',
    type: 'egreso',
    icon: 'chef-hat',
    color: '#fdba74',
    description: 'Comidas fuera de casa y domicilios',
    parent: 'Alimentación',
    budgetLimit: 400_000,
  },
  {
    name: 'Transporte',
    type: 'egreso',
    icon: 'bus',
    color: '#0ea5e9',
    description: 'Movilidad diaria',
    isDefault: true,
    budgetLimit: 450_000,
  },
  {
    name: 'Gasolina',
    type: 'egreso',
    icon: 'fuel',
    color: '#38bdf8',
    description: 'Combustible del vehículo',
    parent: 'Transporte',
    budgetLimit: 300_000,
  },
  {
    name: 'Vivienda',
    type: 'egreso',
    icon: 'home',
    color: '#8b5cf6',
    description: 'Arriendo y administración',
    isDefault: true,
    budgetLimit: 1_800_000,
  },
  {
    name: 'Servicios Públicos',
    type: 'egreso',
    icon: 'plug',
    color: '#a78bfa',
    description: 'Energía, agua, gas e internet',
    budgetLimit: 520_000,
  },
  {
    name: 'Salud',
    type: 'egreso',
    icon: 'heart-pulse',
    color: '#ef4444',
    description: 'EPS, medicina prepagada y droguería',
    budgetLimit: 350_000,
  },
  {
    name: 'Educación',
    type: 'egreso',
    icon: 'graduation-cap',
    color: '#6366f1',
    description: 'Matrículas, cursos y útiles',
    budgetLimit: 600_000,
  },
  {
    name: 'Entretenimiento',
    type: 'egreso',
    icon: 'clapperboard',
    color: '#ec4899',
    description: 'Cine, planes y salidas',
    budgetLimit: 250_000,
  },
  {
    name: 'Suscripciones',
    type: 'egreso',
    icon: 'repeat',
    color: '#f472b6',
    description: 'Streaming y servicios digitales',
    budgetLimit: 150_000,
  },
  {
    name: 'Ropa',
    type: 'egreso',
    icon: 'shirt',
    color: '#d946ef',
    description: 'Vestuario y calzado',
    budgetLimit: 250_000,
  },
  {
    name: 'Tecnología',
    type: 'egreso',
    icon: 'cpu',
    color: '#64748b',
    description: 'Equipos, accesorios y software',
  },
  {
    name: 'Hogar',
    type: 'egreso',
    icon: 'sofa',
    color: '#a16207',
    description: 'Aseo, muebles y reparaciones',
    budgetLimit: 300_000,
  },
  {
    name: 'Mascotas',
    type: 'egreso',
    icon: 'dog',
    color: '#ca8a04',
    description: 'Alimento y veterinario',
  },
  {
    name: 'Cuidado personal',
    type: 'egreso',
    icon: 'scissors',
    color: '#f59e0b',
    description: 'Peluquería, gimnasio y estética',
  },
  {
    name: 'Deudas',
    type: 'egreso',
    icon: 'landmark',
    color: '#dc2626',
    description: 'Cuotas de créditos y tarjetas',
  },
  {
    name: 'Ahorro e inversión',
    type: 'egreso',
    icon: 'target',
    color: '#0d9488',
    description: 'Aportes a ahorro programado y CDT',
  },
  {
    name: 'Impuestos',
    type: 'egreso',
    icon: 'file-text',
    color: '#78716c',
    description: 'Predial, vehículo y renta',
  },
  {
    name: 'Regalos',
    type: 'egreso',
    icon: 'gift',
    color: '#e11d48',
    description: 'Cumpleaños y fechas especiales',
  },
  {
    name: 'Viajes',
    type: 'egreso',
    icon: 'plane',
    color: '#06b6d4',
    description: 'Vuelos, hospedaje y paseos',
  },
  {
    name: 'Seguros',
    type: 'egreso',
    icon: 'shield',
    color: '#475569',
    description: 'Póliza de vehículo, hogar y vida',
  },
];

// ---------------------------------------------------------------------------
// Comercios (gasto variable del día a día)
// ---------------------------------------------------------------------------

export type MerchantSeed = {
  name: string;
  category: string;
  min: number;
  max: number;
  weight: number;
  note: string;
  /** Cuentas preferidas; si ninguna existe en el perfil se usa cualquiera. */
  prefer?: string[];
};

export const MERCHANT_CATALOG: MerchantSeed[] = [
  // Mercado
  {
    name: 'Éxito',
    category: 'Mercado',
    min: 65_000,
    max: 420_000,
    weight: 9,
    note: 'Mercado de la semana',
  },
  {
    name: 'D1',
    category: 'Mercado',
    min: 18_000,
    max: 120_000,
    weight: 12,
    note: 'Compra rápida de despensa',
  },
  {
    name: 'Ara',
    category: 'Mercado',
    min: 15_000,
    max: 95_000,
    weight: 8,
    note: 'Frutas, verduras y aseo',
  },
  {
    name: 'Carulla',
    category: 'Mercado',
    min: 45_000,
    max: 260_000,
    weight: 4,
    note: 'Mercado de fin de semana',
  },
  {
    name: 'Makro',
    category: 'Mercado',
    min: 180_000,
    max: 650_000,
    weight: 2,
    note: 'Compra grande del mes',
  },
  {
    name: 'Tienda La Esquina',
    category: 'Mercado',
    min: 3_000,
    max: 35_000,
    weight: 10,
    note: 'Compra de barrio',
    prefer: ['Efectivo'],
  },
  {
    name: 'Plaza Minorista',
    category: 'Mercado',
    min: 25_000,
    max: 140_000,
    weight: 3,
    note: 'Frutas y verduras de plaza',
    prefer: ['Efectivo'],
  },

  // Restaurantes
  {
    name: 'Rappi',
    category: 'Restaurantes',
    min: 22_000,
    max: 95_000,
    weight: 9,
    note: 'Domicilio',
  },
  {
    name: 'Crepes & Waffles',
    category: 'Restaurantes',
    min: 38_000,
    max: 145_000,
    weight: 4,
    note: 'Almuerzo',
  },
  {
    name: 'El Corral',
    category: 'Restaurantes',
    min: 25_000,
    max: 88_000,
    weight: 5,
    note: 'Hamburguesa',
  },
  {
    name: 'Frisby',
    category: 'Restaurantes',
    min: 28_000,
    max: 92_000,
    weight: 4,
    note: 'Pollo para la casa',
  },
  {
    name: 'Juan Valdez',
    category: 'Restaurantes',
    min: 8_500,
    max: 32_000,
    weight: 8,
    note: 'Café',
  },
  {
    name: 'Corrientazo del centro',
    category: 'Restaurantes',
    min: 12_000,
    max: 22_000,
    weight: 9,
    note: 'Almuerzo ejecutivo',
    prefer: ['Efectivo', 'Nequi'],
  },
  {
    name: 'Panadería La 33',
    category: 'Restaurantes',
    min: 4_000,
    max: 28_000,
    weight: 7,
    note: 'Pan y café',
    prefer: ['Efectivo', 'Nequi'],
  },
  {
    name: 'Sushi Market',
    category: 'Restaurantes',
    min: 65_000,
    max: 190_000,
    weight: 2,
    note: 'Cena',
  },

  // Transporte
  {
    name: 'Uber',
    category: 'Transporte',
    min: 9_000,
    max: 48_000,
    weight: 9,
    note: 'Carrera',
  },
  {
    name: 'DiDi',
    category: 'Transporte',
    min: 8_000,
    max: 42_000,
    weight: 6,
    note: 'Carrera',
  },
  {
    name: 'Metro de Medellín',
    category: 'Transporte',
    min: 2_800,
    max: 5_600,
    weight: 7,
    note: 'Pasaje',
    prefer: ['Efectivo', 'Nequi'],
  },
  {
    name: 'TransMilenio',
    category: 'Transporte',
    min: 2_950,
    max: 5_900,
    weight: 5,
    note: 'Pasaje',
    prefer: ['Efectivo', 'Nequi'],
  },
  {
    name: 'Parqueadero',
    category: 'Transporte',
    min: 3_500,
    max: 22_000,
    weight: 4,
    note: 'Parqueo por horas',
    prefer: ['Efectivo'],
  },
  {
    name: 'Peaje',
    category: 'Transporte',
    min: 11_000,
    max: 32_000,
    weight: 2,
    note: 'Peaje en carretera',
    prefer: ['Efectivo'],
  },

  // Gasolina
  {
    name: 'Terpel',
    category: 'Gasolina',
    min: 60_000,
    max: 220_000,
    weight: 6,
    note: 'Tanqueada',
  },
  {
    name: 'Primax',
    category: 'Gasolina',
    min: 55_000,
    max: 200_000,
    weight: 4,
    note: 'Tanqueada',
  },
  {
    name: 'Biomax',
    category: 'Gasolina',
    min: 50_000,
    max: 180_000,
    weight: 2,
    note: 'Tanqueada',
  },

  // Salud
  {
    name: 'Farmacia Cruz Verde',
    category: 'Salud',
    min: 12_000,
    max: 180_000,
    weight: 6,
    note: 'Medicamentos',
  },
  {
    name: 'Drogas La Rebaja',
    category: 'Salud',
    min: 8_000,
    max: 120_000,
    weight: 4,
    note: 'Medicamentos',
  },
  {
    name: 'Laboratorio Sura',
    category: 'Salud',
    min: 45_000,
    max: 320_000,
    weight: 2,
    note: 'Exámenes de laboratorio',
  },
  {
    name: 'Consulta odontológica',
    category: 'Salud',
    min: 80_000,
    max: 450_000,
    weight: 2,
    note: 'Control odontológico',
  },
  {
    name: 'Óptica Colombiana',
    category: 'Salud',
    min: 120_000,
    max: 780_000,
    weight: 1,
    note: 'Fórmula y monturas',
  },

  // Entretenimiento
  {
    name: 'Cine Colombia',
    category: 'Entretenimiento',
    min: 18_000,
    max: 78_000,
    weight: 4,
    note: 'Cine',
  },
  {
    name: 'Bar La Octava',
    category: 'Entretenimiento',
    min: 45_000,
    max: 260_000,
    weight: 3,
    note: 'Salida con amigos',
  },
  {
    name: 'Parque Explora',
    category: 'Entretenimiento',
    min: 32_000,
    max: 120_000,
    weight: 1,
    note: 'Plan familiar',
  },
  {
    name: 'Concierto Movistar Arena',
    category: 'Entretenimiento',
    min: 150_000,
    max: 480_000,
    weight: 1,
    note: 'Boletería',
  },

  // Hogar
  {
    name: 'Homecenter',
    category: 'Hogar',
    min: 35_000,
    max: 850_000,
    weight: 4,
    note: 'Mejoras del hogar',
  },
  {
    name: 'Alkosto',
    category: 'Hogar',
    min: 60_000,
    max: 1_200_000,
    weight: 3,
    note: 'Electrodoméstico',
  },
  {
    name: 'Ferretería El Tornillo',
    category: 'Hogar',
    min: 12_000,
    max: 180_000,
    weight: 3,
    note: 'Reparación',
    prefer: ['Efectivo'],
  },
  {
    name: 'Servicio de aseo',
    category: 'Hogar',
    min: 60_000,
    max: 120_000,
    weight: 4,
    note: 'Jornada de aseo',
    prefer: ['Nequi', 'Daviplata', 'Efectivo'],
  },

  // Ropa
  {
    name: 'Arturo Calle',
    category: 'Ropa',
    min: 90_000,
    max: 620_000,
    weight: 3,
    note: 'Ropa formal',
  },
  {
    name: 'Falabella',
    category: 'Ropa',
    min: 60_000,
    max: 480_000,
    weight: 3,
    note: 'Ropa y calzado',
  },
  {
    name: 'Zara',
    category: 'Ropa',
    min: 110_000,
    max: 540_000,
    weight: 2,
    note: 'Ropa',
  },
  {
    name: 'Bosi',
    category: 'Ropa',
    min: 150_000,
    max: 420_000,
    weight: 1,
    note: 'Calzado',
  },

  // Tecnología
  {
    name: 'Mercado Libre',
    category: 'Tecnología',
    min: 45_000,
    max: 1_400_000,
    weight: 3,
    note: 'Compra en línea',
  },
  {
    name: 'Ktronix',
    category: 'Tecnología',
    min: 120_000,
    max: 2_800_000,
    weight: 2,
    note: 'Equipo de cómputo',
  },
  {
    name: 'Amazon',
    category: 'Tecnología',
    min: 60_000,
    max: 900_000,
    weight: 2,
    note: 'Accesorios importados',
  },

  // Cuidado personal
  {
    name: 'Peluquería Style',
    category: 'Cuidado personal',
    min: 25_000,
    max: 120_000,
    weight: 4,
    note: 'Corte de cabello',
    prefer: ['Efectivo', 'Nequi'],
  },
  {
    name: 'Bodytech',
    category: 'Cuidado personal',
    min: 95_000,
    max: 185_000,
    weight: 2,
    note: 'Mensualidad gimnasio',
  },
  {
    name: 'Locatel',
    category: 'Cuidado personal',
    min: 25_000,
    max: 190_000,
    weight: 3,
    note: 'Cuidado personal',
  },

  // Mascotas
  {
    name: 'Agrocampo',
    category: 'Mascotas',
    min: 45_000,
    max: 280_000,
    weight: 3,
    note: 'Alimento para mascota',
  },
  {
    name: 'Veterinaria Mi Amigo',
    category: 'Mascotas',
    min: 60_000,
    max: 420_000,
    weight: 2,
    note: 'Consulta veterinaria',
  },

  // Regalos y viajes
  {
    name: 'Regalo cumpleaños',
    category: 'Regalos',
    min: 40_000,
    max: 350_000,
    weight: 3,
    note: 'Detalle de cumpleaños',
  },
  {
    name: 'Avianca',
    category: 'Viajes',
    min: 280_000,
    max: 1_600_000,
    weight: 1,
    note: 'Tiquetes',
  },
  {
    name: 'Airbnb',
    category: 'Viajes',
    min: 180_000,
    max: 950_000,
    weight: 1,
    note: 'Hospedaje',
  },
  {
    name: 'Hotel Estelar',
    category: 'Viajes',
    min: 240_000,
    max: 780_000,
    weight: 1,
    note: 'Hospedaje',
  },

  // Educación
  {
    name: 'Platzi',
    category: 'Educación',
    min: 89_000,
    max: 420_000,
    weight: 2,
    note: 'Suscripción de cursos',
  },
  {
    name: 'Panamericana',
    category: 'Educación',
    min: 25_000,
    max: 260_000,
    weight: 2,
    note: 'Útiles y papelería',
  },
];

// ---------------------------------------------------------------------------
// Movimientos recurrentes (la columna vertebral del mes)
// ---------------------------------------------------------------------------

export type RecurringSeed = {
  label: string;
  category: string;
  type: 'ingreso' | 'egreso';
  /** Día del mes; para 'biweekly' se usa este día y el día + 15. */
  day: number;
  frequency: 'monthly' | 'biweekly';
  min: number;
  max: number;
  prefer?: string[];
  note: string;
};

export const RECURRING_CATALOG: Record<string, RecurringSeed> = {
  salarioMensual: {
    label: 'Pago de nómina',
    category: 'Salario',
    type: 'ingreso',
    day: 30,
    frequency: 'monthly',
    min: 0,
    max: 0,
    note: 'Nómina del mes',
  },
  salarioQuincenal: {
    label: 'Pago de nómina',
    category: 'Salario',
    type: 'ingreso',
    day: 15,
    frequency: 'biweekly',
    min: 0,
    max: 0,
    note: 'Nómina quincenal',
  },
  arriendo: {
    label: 'Arriendo apartamento',
    category: 'Vivienda',
    type: 'egreso',
    day: 5,
    frequency: 'monthly',
    min: 0,
    max: 0,
    note: 'Canon de arrendamiento',
  },
  administracion: {
    label: 'Administración conjunto',
    category: 'Vivienda',
    type: 'egreso',
    day: 8,
    frequency: 'monthly',
    min: 180_000,
    max: 420_000,
    note: 'Cuota de administración',
  },
  energia: {
    label: 'EPM — energía y agua',
    category: 'Servicios Públicos',
    type: 'egreso',
    day: 12,
    frequency: 'monthly',
    min: 120_000,
    max: 320_000,
    note: 'Factura de servicios',
  },
  gas: {
    label: 'Vanti — gas natural',
    category: 'Servicios Públicos',
    type: 'egreso',
    day: 14,
    frequency: 'monthly',
    min: 28_000,
    max: 75_000,
    note: 'Factura de gas',
  },
  internet: {
    label: 'Claro Hogar — internet',
    category: 'Servicios Públicos',
    type: 'egreso',
    day: 18,
    frequency: 'monthly',
    min: 85_000,
    max: 150_000,
    note: 'Internet y TV',
  },
  celular: {
    label: 'Movistar — plan celular',
    category: 'Servicios Públicos',
    type: 'egreso',
    day: 20,
    frequency: 'monthly',
    min: 45_000,
    max: 95_000,
    note: 'Plan de datos',
  },
  netflix: {
    label: 'Netflix',
    category: 'Suscripciones',
    type: 'egreso',
    day: 7,
    frequency: 'monthly',
    min: 26_900,
    max: 44_900,
    note: 'Suscripción mensual',
  },
  spotify: {
    label: 'Spotify',
    category: 'Suscripciones',
    type: 'egreso',
    day: 3,
    frequency: 'monthly',
    min: 16_900,
    max: 26_900,
    note: 'Suscripción mensual',
  },
  gimnasio: {
    label: 'Smart Fit',
    category: 'Cuidado personal',
    type: 'egreso',
    day: 10,
    frequency: 'monthly',
    min: 69_900,
    max: 129_900,
    note: 'Mensualidad gimnasio',
  },
  eps: {
    label: 'Sura — medicina prepagada',
    category: 'Salud',
    type: 'egreso',
    day: 6,
    frequency: 'monthly',
    min: 180_000,
    max: 420_000,
    note: 'Plan complementario',
  },
  ahorro: {
    label: 'Ahorro programado',
    category: 'Ahorro e inversión',
    type: 'egreso',
    day: 2,
    frequency: 'monthly',
    min: 0,
    max: 0,
    note: 'Aporte mensual a ahorro',
  },
  pagoTarjeta: {
    label: 'Pago tarjeta de crédito',
    category: 'Deudas',
    type: 'egreso',
    day: 5,
    frequency: 'monthly',
    min: 0,
    max: 0,
    note: 'Pago total facturación tarjeta',
  },
  seguroVehiculo: {
    label: 'Seguro del vehículo',
    category: 'Seguros',
    type: 'egreso',
    day: 22,
    frequency: 'monthly',
    min: 95_000,
    max: 185_000,
    note: 'Cuota póliza todo riesgo',
  },
  colegio: {
    label: 'Pensión colegio',
    category: 'Educación',
    type: 'egreso',
    day: 9,
    frequency: 'monthly',
    min: 380_000,
    max: 760_000,
    note: 'Pensión mensual',
  },
  arriendoRecibido: {
    label: 'Canon de arrendamiento local',
    category: 'Arriendos',
    type: 'ingreso',
    day: 4,
    frequency: 'monthly',
    min: 900_000,
    max: 1_400_000,
    note: 'Arriendo recibido del local',
  },
};

// ---------------------------------------------------------------------------
// Perfiles de usuario
// ---------------------------------------------------------------------------

export type UserProfileSeed = {
  name: string;
  email: string;
  city: string;
  occupation: string;
  /** Ingreso mensual de referencia (COP). */
  monthlyIncome: number;
  /** Multiplica los montos de gasto variable: 1 = consumo promedio. */
  spendingScale: number;
  /** Cuántas transacciones se generan para este usuario. */
  transactionsTarget: number;
  accounts: string[];
  recurring: string[];
  /** Ingresos extra esporádicos: categoría → probabilidad mensual. */
  extraIncome: {
    category: string;
    label: string;
    min: number;
    max: number;
    chance: number;
  }[];
};

export const USER_PROFILES: UserProfileSeed[] = [
  {
    name: 'Juan Hernández',
    email: `juan.hernandez@${SEED_EMAIL_DOMAIN}`,
    city: 'Medellín',
    occupation: 'Ingeniero de software',
    monthlyIncome: 8_500_000,
    spendingScale: 1.15,
    transactionsTarget: 940,
    accounts: [
      'bancolombiaAhorros',
      'nequi',
      'efectivo',
      'visaBancolombia',
      'bbva',
    ],
    recurring: [
      'salarioQuincenal',
      'arriendo',
      'administracion',
      'energia',
      'gas',
      'internet',
      'celular',
      'netflix',
      'spotify',
      'gimnasio',
      'eps',
      'ahorro',
      'pagoTarjeta',
    ],
    extraIncome: [
      {
        category: 'Freelance',
        label: 'Proyecto freelance',
        min: 1_200_000,
        max: 4_500_000,
        chance: 0.45,
      },
      {
        category: 'Bonificaciones',
        label: 'Bono por desempeño',
        min: 800_000,
        max: 3_200_000,
        chance: 0.15,
      },
      {
        category: 'Rendimientos',
        label: 'Rendimientos CDT',
        min: 45_000,
        max: 220_000,
        chance: 0.5,
      },
    ],
  },
  {
    name: 'Valentina Ríos',
    email: `valentina.rios@${SEED_EMAIL_DOMAIN}`,
    city: 'Bogotá',
    occupation: 'Diseñadora independiente',
    monthlyIncome: 5_200_000,
    spendingScale: 1.0,
    transactionsTarget: 850,
    accounts: [
      'davivienda',
      'nequi',
      'daviplata',
      'efectivo',
      'masterFalabella',
    ],
    recurring: [
      'arriendo',
      'energia',
      'internet',
      'celular',
      'netflix',
      'spotify',
      'eps',
      'ahorro',
      'pagoTarjeta',
    ],
    extraIncome: [
      {
        category: 'Freelance',
        label: 'Diseño de identidad de marca',
        min: 900_000,
        max: 3_800_000,
        chance: 0.9,
      },
      {
        category: 'Ventas',
        label: 'Venta de ilustraciones',
        min: 150_000,
        max: 900_000,
        chance: 0.5,
      },
      {
        category: 'Reembolsos',
        label: 'Reembolso de cliente',
        min: 80_000,
        max: 450_000,
        chance: 0.2,
      },
    ],
  },
  {
    name: 'Andrés Mejía',
    email: `andres.mejia@${SEED_EMAIL_DOMAIN}`,
    city: 'Cali',
    occupation: 'Comerciante — tienda de barrio',
    monthlyIncome: 6_400_000,
    spendingScale: 1.25,
    transactionsTarget: 990,
    accounts: [
      'bancolombiaAhorros',
      'daviplata',
      'efectivo',
      'visaBancolombia',
    ],
    recurring: [
      'arriendo',
      'administracion',
      'energia',
      'gas',
      'internet',
      'celular',
      'seguroVehiculo',
      'colegio',
      'arriendoRecibido',
      'pagoTarjeta',
    ],
    extraIncome: [
      {
        category: 'Ventas',
        label: 'Cierre de caja del día',
        min: 180_000,
        max: 950_000,
        chance: 1,
      },
      {
        category: 'Bonificaciones',
        label: 'Incentivo del proveedor',
        min: 200_000,
        max: 800_000,
        chance: 0.25,
      },
    ],
  },
  {
    name: 'Laura Gómez',
    email: `laura.gomez@${SEED_EMAIL_DOMAIN}`,
    city: 'Bucaramanga',
    occupation: 'Docente universitaria',
    monthlyIncome: 4_600_000,
    spendingScale: 0.85,
    transactionsTarget: 730,
    accounts: ['bbva', 'nequi', 'efectivo', 'masterFalabella'],
    recurring: [
      'salarioMensual',
      'arriendo',
      'energia',
      'gas',
      'internet',
      'celular',
      'netflix',
      'gimnasio',
      'eps',
      'ahorro',
      'colegio',
      'pagoTarjeta',
    ],
    extraIncome: [
      {
        category: 'Freelance',
        label: 'Asesoría de tesis',
        min: 350_000,
        max: 1_200_000,
        chance: 0.4,
      },
      {
        category: 'Bonificaciones',
        label: 'Prima de servicios',
        min: 1_800_000,
        max: 2_400_000,
        chance: 0.17,
      },
    ],
  },
  {
    name: 'Santiago Castaño',
    email: `santiago.castano@${SEED_EMAIL_DOMAIN}`,
    city: 'Medellín',
    occupation: 'Practicante de ingeniería',
    monthlyIncome: 1_900_000,
    spendingScale: 0.6,
    transactionsTarget: 590,
    accounts: ['nequi', 'bancolombiaAhorros', 'efectivo'],
    recurring: ['salarioMensual', 'celular', 'spotify', 'internet'],
    extraIncome: [
      {
        category: 'Freelance',
        label: 'Soporte técnico a domicilio',
        min: 120_000,
        max: 600_000,
        chance: 0.55,
      },
      {
        category: 'Reembolsos',
        label: 'Reembolso de transporte',
        min: 40_000,
        max: 180_000,
        chance: 0.3,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Deudas y plantillas de transferencia
// ---------------------------------------------------------------------------

export type DebtSeed = {
  name: string;
  payee: string;
  min: number;
  max: number;
  isRecurring: boolean;
  recurrenceType?: 'monthly' | 'biweekly';
  notes: string;
};

export const DEBT_CATALOG: DebtSeed[] = [
  {
    name: 'Cuota crédito de vehículo',
    payee: 'Banco de Bogotá',
    min: 780_000,
    max: 1_450_000,
    isRecurring: true,
    recurrenceType: 'monthly',
    notes: 'Crédito a 60 meses — cuota fija',
  },
  {
    name: 'Crédito educativo',
    payee: 'ICETEX',
    min: 320_000,
    max: 720_000,
    isRecurring: true,
    recurrenceType: 'monthly',
    notes: 'Cuota del semestre en curso',
  },
  {
    name: 'Cuota nevera',
    payee: 'Alkosto',
    min: 180_000,
    max: 420_000,
    isRecurring: true,
    recurrenceType: 'monthly',
    notes: 'Compra a 12 cuotas sin interés',
  },
  {
    name: 'Préstamo familiar',
    payee: 'Carlos Hernández',
    min: 400_000,
    max: 2_500_000,
    isRecurring: false,
    notes: 'Préstamo informal, abonos según disponibilidad',
  },
  {
    name: 'Impuesto predial',
    payee: 'Alcaldía de Medellín',
    min: 450_000,
    max: 1_800_000,
    isRecurring: false,
    notes: 'Pago anual con descuento por pronto pago',
  },
  {
    name: 'Impuesto vehicular',
    payee: 'Gobernación de Antioquia',
    min: 280_000,
    max: 950_000,
    isRecurring: false,
    notes: 'Liquidación anual',
  },
  {
    name: 'Matrícula universidad',
    payee: 'Universidad de Antioquia',
    min: 1_200_000,
    max: 4_800_000,
    isRecurring: false,
    notes: 'Matrícula del semestre',
  },
  {
    name: 'Cuota libre inversión',
    payee: 'Bancolombia',
    min: 520_000,
    max: 1_600_000,
    isRecurring: true,
    recurrenceType: 'monthly',
    notes: 'Crédito de libre inversión a 36 meses',
  },
  {
    name: 'Cuota portátil',
    payee: 'Falabella CMR',
    min: 210_000,
    max: 460_000,
    isRecurring: true,
    recurrenceType: 'monthly',
    notes: 'Diferido a 18 cuotas',
  },
  {
    name: 'Reparación del carro',
    payee: 'Taller AutoMotriz',
    min: 350_000,
    max: 1_900_000,
    isRecurring: false,
    notes: 'Acuerdo de pago en 3 abonos',
  },
];

export type TransferTemplateSeed = {
  name: string;
  payeeName: string;
  payeeBank: string;
  min: number;
  max: number;
  recurrenceType: 'reminder' | 'automatic';
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'custom';
  dayOfMonth: number;
  customIntervalDays?: number;
};

export const TRANSFER_TEMPLATE_CATALOG: TransferTemplateSeed[] = [
  {
    name: 'Arriendo apartamento',
    payeeName: 'Inmobiliaria Bienes y Raíces',
    payeeBank: 'Bancolombia',
    min: 1_200_000,
    max: 2_600_000,
    recurrenceType: 'reminder',
    frequency: 'monthly',
    dayOfMonth: 5,
  },
  {
    name: 'Mesada de la casa',
    payeeName: 'María Elena Castaño',
    payeeBank: 'Nequi',
    min: 300_000,
    max: 800_000,
    recurrenceType: 'automatic',
    frequency: 'monthly',
    dayOfMonth: 1,
  },
  {
    name: 'Pago señora del aseo',
    payeeName: 'Rosa Delgado',
    payeeBank: 'Daviplata',
    min: 90_000,
    max: 160_000,
    recurrenceType: 'reminder',
    frequency: 'biweekly',
    dayOfMonth: 15,
  },
  {
    name: 'Ahorro programado',
    payeeName: 'Fondo Protección',
    payeeBank: 'Davivienda',
    min: 200_000,
    max: 900_000,
    recurrenceType: 'automatic',
    frequency: 'monthly',
    dayOfMonth: 2,
  },
  {
    name: 'Cuota del gimnasio',
    payeeName: 'Smart Fit Colombia',
    payeeBank: 'Banco de Bogotá',
    min: 69_900,
    max: 129_900,
    recurrenceType: 'reminder',
    frequency: 'monthly',
    dayOfMonth: 10,
  },
  {
    name: 'Pago proveedor de insumos',
    payeeName: 'Distribuidora El Progreso',
    payeeBank: 'BBVA',
    min: 450_000,
    max: 2_200_000,
    recurrenceType: 'reminder',
    frequency: 'custom',
    dayOfMonth: 20,
    customIntervalDays: 45,
  },
  {
    name: 'Clases de inglés',
    payeeName: 'Centro Colombo Americano',
    payeeBank: 'Bancolombia',
    min: 240_000,
    max: 480_000,
    recurrenceType: 'reminder',
    frequency: 'bimonthly',
    dayOfMonth: 12,
  },
];

// ---------------------------------------------------------------------------
// Lista de espera y jobs de IA
// ---------------------------------------------------------------------------

export const WAITING_LIST_NAMES = [
  'camila.torres',
  'daniel.ospina',
  'mariana.lopez',
  'felipe.cardona',
  'sara.velez',
  'nicolas.arango',
  'paula.restrepo',
  'julian.moreno',
  'isabella.ruiz',
  'tomas.jaramillo',
  'gabriela.pineda',
  'esteban.quintero',
  'manuela.zapata',
  'sebastian.correa',
  'luciana.bedoya',
  'mateo.giraldo',
  'antonia.serna',
  'emiliano.rios',
  'salome.marin',
  'martin.echeverri',
  'juliana.agudelo',
  'samuel.montoya',
  'renata.duque',
  'alejandro.saldarriaga',
  'catalina.uribe',
  'david.betancur',
  'sofia.mesa',
  'ricardo.londono',
  'natalia.gallego',
  'oscar.pelaez',
  'alejandra.tamayo',
  'diego.ceballos',
  'carolina.henao',
  'jorge.arboleda',
  'daniela.osorio',
  'andres.valencia',
  'lina.castrillon',
  'camilo.gutierrez',
  'adriana.molina',
  'pablo.escobar.ruiz',
];

export const WAITING_LIST_REASONS = [
  'Quiero llevar el control de mis gastos sin tener que abrir Excel todos los días.',
  'Me interesa la funcionalidad de presupuestos por categoría.',
  'Busco algo que me avise cuándo se vencen las cuotas de la tarjeta.',
  'Tengo un negocio pequeño y necesito separar gastos personales de los del negocio.',
  'Me llamó la atención que se puedan registrar gastos por voz.',
  'Quiero saber en qué se me va el sueldo cada mes.',
  'Necesito planear el pago de mis deudas con un orden claro.',
  'Estoy ahorrando para un viaje y quiero medir el avance.',
  'Me gustaría ver reportes mensuales comparados con el mes anterior.',
  'Uso tres bancos distintos y quiero verlo todo en un solo lugar.',
  'Quiero adjuntar las facturas a cada gasto para la declaración de renta.',
  'Estoy empezando a trabajar y no sé por dónde arrancar con mis finanzas.',
];

export const AI_JOB_SAMPLES = [
  {
    fileName: 'factura-exito.jpg',
    mimeType: 'image/jpeg',
    userText: 'Mercado del sábado en el Éxito',
    category: 'Mercado',
    min: 120_000,
    max: 380_000,
  },
  {
    fileName: 'recibo-epm.pdf',
    mimeType: 'application/pdf',
    userText: 'Factura de servicios de este mes',
    category: 'Servicios Públicos',
    min: 140_000,
    max: 300_000,
  },
  {
    fileName: 'nota-voz-almuerzo.ogg',
    mimeType: 'audio/ogg',
    userText: 'Almorcé con el equipo, pagué yo',
    category: 'Restaurantes',
    min: 45_000,
    max: 180_000,
  },
  {
    fileName: 'nota-voz-taxi.ogg',
    mimeType: 'audio/ogg',
    userText: 'Un taxi del aeropuerto a la casa',
    category: 'Transporte',
    min: 45_000,
    max: 90_000,
  },
  {
    fileName: 'factura-droguería.jpg',
    mimeType: 'image/jpeg',
    userText: 'Medicamentos de la fórmula',
    category: 'Salud',
    min: 30_000,
    max: 220_000,
  },
  {
    fileName: 'recibo-gasolina.png',
    mimeType: 'image/png',
    userText: 'Tanqueada de la semana',
    category: 'Gasolina',
    min: 80_000,
    max: 200_000,
  },
  {
    fileName: 'nota-voz-mercado.ogg',
    mimeType: 'audio/ogg',
    userText: 'Compré mercado en el D1, como cuarenta mil pesos',
    category: 'Mercado',
    min: 30_000,
    max: 60_000,
  },
  {
    fileName: 'factura-restaurante.pdf',
    mimeType: 'application/pdf',
    userText: 'Cena de aniversario',
    category: 'Restaurantes',
    min: 120_000,
    max: 350_000,
  },
];

export const AI_JOB_ERRORS = [
  'No se pudo extraer el monto de la imagen: la factura está borrosa.',
  'El audio no tiene voz audible.',
  'No se identificó una fecha válida en el documento.',
  'El archivo está protegido con contraseña.',
];
