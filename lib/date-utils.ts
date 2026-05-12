import { Tenant } from "./types"

/**
 * Parse the day number from a YYYY-MM-DD string without Date constructor
 * to avoid UTC timezone offset issues.
 */
function dayFromDateStr(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10)
}

/**
 * Returns the payment day-of-month for a given tenant.
 */
export function getPaymentDay(tenant: Tenant): number {
  if (tenant.useArrivalDayForPayment) {
    return dayFromDateStr(tenant.checkInDate)
  }
  return tenant.customPaymentDay ?? dayFromDateStr(tenant.checkInDate)
}

/**
 * Returns true if the given date (YYYY-MM-DD) matches the tenant's payment day.
 * Also checks that the tenant is active on that date.
 */
export function isTenantPaymentDay(tenant: Tenant, dateStr: string): boolean {
  // Compare day numbers directly from strings to avoid UTC offset bugs
  const dayNum = dayFromDateStr(dateStr)
  const payDay = getPaymentDay(tenant)
  if (dayNum !== payDay) return false

  // String comparison works for YYYY-MM-DD format
  if (dateStr < tenant.checkInDate) return false
  if (tenant.checkOutDate && dateStr > tenant.checkOutDate) return false

  return true
}

/**
 * Returns all dates (as YYYY-MM-DD strings) in a month that are payment days
 * for a given tenant.
 */
export function getPaymentDatesInMonth(
  tenant: Tenant,
  year: number,
  month: number // 1-12
): string[] {
  const payDay = getPaymentDay(tenant)
  const daysInMonth = new Date(year, month, 0).getDate()
  if (payDay > daysInMonth) return []

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(payDay).padStart(2, "0")}`
  if (isTenantPaymentDay(tenant, dateStr)) return [dateStr]
  return []
}

/**
 * Format a date string YYYY-MM-DD to DD/MM/YYYY (Chilean format).
 */
export function formatDateCL(dateStr: string | null): string {
  if (!dateStr) return "Indefinido"
  const [y, m, d] = dateStr.split("-")
  return `${d}/${m}/${y}`
}

/**
 * Today as YYYY-MM-DD
 */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Return start of week (Sunday) for a given date
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get all 7 days of the week containing the given date
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/**
 * Get the 6-week grid for a month calendar (42 cells)
 */
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (Date | null)[] = []

  // Padding before month start
  for (let i = 0; i < firstDay; i++) cells.push(null)

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month - 1, d))
  }

  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

/**
 * Format Date to YYYY-MM-DD
 */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
