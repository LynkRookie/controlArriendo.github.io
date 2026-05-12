export type Amenity =
  | "television"
  | "luz"
  | "agua"
  | "internet"
  | "muebles"
  | "frazada"
  | "sabanas"
  | "cobertor"
  | "almohada"
  | "colchon"
  | "refrigerador"
  | "microondas"
  | "closet"
  | "escritorio"
  | "silla"

export const AMENITY_LABELS: Record<Amenity, string> = {
  television: "Televisión",
  luz: "Luz",
  agua: "Agua",
  internet: "Internet",
  muebles: "Muebles",
  frazada: "Frazada",
  sabanas: "Sábanas",
  cobertor: "Cobertor",
  almohada: "Almohada",
  colchon: "Colchón",
  refrigerador: "Refrigerador",
  microondas: "Microondas",
  closet: "Clóset",
  escritorio: "Escritorio",
  silla: "Silla",
}

export const ALL_AMENITIES: Amenity[] = [
  "television",
  "luz",
  "agua",
  "internet",
  "muebles",
  "frazada",
  "sabanas",
  "cobertor",
  "almohada",
  "colchon",
  "refrigerador",
  "microondas",
  "closet",
  "escritorio",
  "silla",
]

export type StayType = "indefinido" | "meses" | "dias"

export type MaritalStatus = "soltero" | "casado" | "pareja" | "divorciado" | "viudo" | "otro"

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  pareja: "Con pareja",
  divorciado: "Divorciado/a",
  viudo: "Viudo/a",
  otro: "Otro",
}

export interface Tenant {
  id: string
  // Personal data
  name: string
  rut: string
  nationality: string
  occupation: string
  maritalStatus: MaritalStatus | ""
  phone: string
  phoneCountry: string
  emergencyPhone: string
  emergencyPhoneCountry: string
  emergencyContactName: string
  // Room
  roomNumber: number // 1-11
  // Stay
  checkInDate: string // ISO date string YYYY-MM-DD
  checkOutDate: string | null // null = indefinido
  stayType: StayType
  // Payment
  useArrivalDayForPayment: boolean // true = use check-in day of month
  customPaymentDay: number | null // 1-31, used if useArrivalDayForPayment=false
  rentAmount: number
  // Amenities included
  amenities: Amenity[]
  // Notes
  notes: string
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface PaymentRecord {
  id: string
  tenantId: string
  year: number
  month: number // 1-12
  paidAt: string | null // ISO date string, null = not paid
  amount: number
}

export type CalendarView = "month" | "week" | "day"

// ─── Financial ───────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "luz"
  | "agua"
  | "internet"
  | "gas"
  | "mantencion"
  | "limpieza"
  | "otros"

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  luz: "Luz",
  agua: "Agua",
  internet: "Internet",
  gas: "Gas",
  mantencion: "Mantención",
  limpieza: "Limpieza",
  otros: "Otros",
}

export const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "luz",
  "agua",
  "internet",
  "gas",
  "mantencion",
  "limpieza",
  "otros",
]

export interface Expense {
  id: string
  year: number
  month: number // 1-12
  category: ExpenseCategory
  description: string
  amount: number
  date: string // YYYY-MM-DD
  createdAt: string
}
