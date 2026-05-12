import { Tenant, PaymentRecord, Expense } from "./types"

const TENANTS_KEY = "molino_tenants"
const PAYMENTS_KEY = "molino_payments"
const EXPENSES_KEY = "molino_expenses"

// ─── Tenants ────────────────────────────────────────────────────────────────

export function getTenants(): Tenant[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(TENANTS_KEY)
    return raw ? (JSON.parse(raw) as Tenant[]) : []
  } catch {
    return []
  }
}

export function saveTenants(tenants: Tenant[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(TENANTS_KEY, JSON.stringify(tenants))
}

export function addTenant(tenant: Tenant): void {
  const current = getTenants()
  saveTenants([...current, tenant])
}

export function updateTenant(updated: Tenant): void {
  const current = getTenants()
  saveTenants(current.map((t) => (t.id === updated.id ? updated : t)))
}

export function deleteTenant(id: string): void {
  const current = getTenants()
  saveTenants(current.filter((t) => t.id !== id))
  // Also remove payment records
  const payments = getPayments()
  savePayments(payments.filter((p) => p.tenantId !== id))
}

// ─── Payments ───────────────────────────────────────────────────────────────

export function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY)
    return raw ? (JSON.parse(raw) as PaymentRecord[]) : []
  } catch {
    return []
  }
}

export function savePayments(payments: PaymentRecord[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
}

export function markPaymentPaid(
  tenantId: string,
  year: number,
  month: number,
  amount: number
): void {
  const payments = getPayments()
  const existing = payments.find(
    (p) => p.tenantId === tenantId && p.year === year && p.month === month
  )
  if (existing) {
    savePayments(
      payments.map((p) =>
        p.id === existing.id ? { ...p, paidAt: new Date().toISOString() } : p
      )
    )
  } else {
    const newRecord: PaymentRecord = {
      id: crypto.randomUUID(),
      tenantId,
      year,
      month,
      paidAt: new Date().toISOString(),
      amount,
    }
    savePayments([...payments, newRecord])
  }
}

export function markPaymentUnpaid(
  tenantId: string,
  year: number,
  month: number
): void {
  const payments = getPayments()
  const existing = payments.find(
    (p) => p.tenantId === tenantId && p.year === year && p.month === month
  )
  if (existing) {
    savePayments(
      payments.map((p) =>
        p.id === existing.id ? { ...p, paidAt: null } : p
      )
    )
  }
}

export function getPaymentForMonth(
  tenantId: string,
  year: number,
  month: number
): PaymentRecord | undefined {
  return getPayments().find(
    (p) => p.tenantId === tenantId && p.year === year && p.month === month
  )
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EXPENSES_KEY)
    return raw ? (JSON.parse(raw) as Expense[]) : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
}

export function addExpense(expense: Expense): void {
  saveExpenses([...getExpenses(), expense])
}

export function updateExpense(updated: Expense): void {
  saveExpenses(getExpenses().map((e) => (e.id === updated.id ? updated : e)))
}

export function deleteExpense(id: string): void {
  saveExpenses(getExpenses().filter((e) => e.id !== id))
}

export function getExpensesForMonth(year: number, month: number): Expense[] {
  return getExpenses().filter((e) => e.year === year && e.month === month)
}
