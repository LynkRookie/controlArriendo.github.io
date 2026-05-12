"use client"

import { useEffect, useState, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  ReceiptText,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  Expense,
  ExpenseCategory,
  ALL_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  Tenant,
  PaymentRecord,
} from "@/lib/types"
import { MONTHS_ES, ROOM_COLORS } from "@/lib/constants"
import {
  getTenants,
  getPayments,
  getExpenses,
  addExpense,
  deleteExpense,
} from "@/lib/storage"
import {
  buildFinanceSummary,
  exportFinanceExcel,
  exportFinanceWord,
  FinanceSummary,
} from "@/lib/export-finance"
import { cn } from "@/lib/utils"

// ── helpers ──────────────────────────────────────────────────────────────────

function clpFormat(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL")
}

function parseCLP(raw: string): number {
  return parseInt(raw.replace(/\./g, "").replace(/\$/g, "").trim(), 10) || 0
}

function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  return parseInt(digits, 10).toLocaleString("es-CL")
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant = "default",
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  variant?: "default" | "green" | "red" | "blue"
}) {
  const colors = {
    default: "bg-card border-border",
    green: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-primary/5 border-primary/20",
  }
  const iconColors = {
    default: "text-muted-foreground bg-muted",
    green: "text-emerald-600 bg-emerald-100",
    red: "text-red-600 bg-red-100",
    blue: "text-primary bg-primary/10",
  }
  const textColors = {
    default: "text-foreground",
    green: "text-emerald-700",
    red: "text-red-700",
    blue: "text-primary",
  }

  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", colors[variant])}>
      <div className="flex items-center gap-3">
        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconColors[variant])}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={cn("text-lg font-bold leading-tight truncate", textColors[variant])}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Expense form ──────────────────────────────────────────────────────────────

interface ExpenseFormProps {
  year: number
  month: number
  onSaved: () => void
  onCancel: () => void
}

function ExpenseForm({ year, month, onSaved, onCancel }: ExpenseFormProps) {
  const today = new Date()
  const defaultDate = `${year}-${String(month).padStart(2, "0")}-${String(
    today.getMonth() + 1 === month && today.getFullYear() === year
      ? today.getDate()
      : 1
  ).padStart(2, "0")}`

  const [category, setCategory] = useState<ExpenseCategory>("luz")
  const [description, setDescription] = useState("")
  const [amountStr, setAmountStr] = useState("")
  const [date, setDate] = useState(defaultDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseCLP(amountStr)
    if (!amount || amount <= 0) return

    const expense: Expense = {
      id: crypto.randomUUID(),
      year,
      month,
      category,
      description: description.trim(),
      amount,
      date,
      createdAt: new Date().toISOString(),
    }
    addExpense(expense)
    onSaved()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-foreground">Agregar gasto</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ALL_EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Monto ($)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amountStr}
            onChange={(e) => setAmountStr(formatAmountInput(e.target.value))}
            placeholder="Ej: 85.000"
            required
            className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Factura Enel mayo"
            className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha del gasto</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-input bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          Guardar gasto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-input bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FinancePage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState<string | null>(null)

  const reload = useCallback(() => {
    setTenants(getTenants())
    setPayments(getPayments())
    setExpenses(getExpenses())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1

  const summary: FinanceSummary = buildFinanceSummary(
    viewYear,
    viewMonth,
    tenants,
    payments,
    expenses
  )

  function handleDeleteExpense(id: string) {
    deleteExpense(id)
    reload()
    setConfirmDeleteExpId(null)
  }

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()

  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ingresos, gastos y ganancias del recinto
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => exportFinanceExcel(summary)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30"
          >
            <FileDown size={16} />
            Exportar Excel
          </button>
          <button
            onClick={() => exportFinanceWord(summary)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border text-sm font-semibold hover:bg-muted active:scale-[0.98] transition-all shadow-sm"
          >
            <FileDown size={16} />
            Exportar Word
          </button>
        </div>
      </div>

      {/* ── Month selector ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-foreground">
            {MONTHS_ES[viewMonth - 1]} {viewYear}
          </p>
          {isCurrentMonth && (
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Mes actual
            </span>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Summary stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Ingresos brutos"
          value={clpFormat(summary.grossIncome)}
          sub={`${summary.paidTenants.length} arriendo${summary.paidTenants.length !== 1 ? "s" : ""} cobrado${summary.paidTenants.length !== 1 ? "s" : ""}`}
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          label="Total gastos"
          value={clpFormat(summary.totalExpenses)}
          sub={`${summary.expenses.length} gasto${summary.expenses.length !== 1 ? "s" : ""} registrado${summary.expenses.length !== 1 ? "s" : ""}`}
          icon={TrendingDown}
          variant="red"
        />
        <StatCard
          label="Ganancia neta"
          value={clpFormat(summary.netProfit)}
          sub={summary.netProfit >= 0 ? "Saldo positivo" : "Saldo negativo"}
          icon={Wallet}
          variant={summary.netProfit >= 0 ? "blue" : "red"}
        />
        <StatCard
          label="Promedio diario"
          value={clpFormat(summary.dailyAvg)}
          sub={`~${clpFormat(summary.weeklyAvg)}/semana`}
          icon={CalendarDays}
          variant="default"
        />
      </div>

      {/* ── Income breakdown ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" aria-hidden="true" />
            <p className="font-bold text-sm text-foreground">Ingresos por pieza</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {MONTHS_ES[viewMonth - 1]} {viewYear}
          </span>
        </div>

        {summary.paidTenants.length === 0 && summary.unpaidTenants.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No hay arrendatarios activos en este mes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...summary.paidTenants, ...summary.unpaidTenants]
              .sort((a, b) => a.roomNumber - b.roomNumber)
              .map((t) => {
                const room = ROOM_COLORS[t.roomNumber]
                const paid = summary.paidTenants.includes(t)
                const stayLabel =
                  t.stayType === "indefinido"
                    ? "Plazo indefinido"
                    : t.stayType === "meses"
                    ? "Por meses"
                    : "Por días/noches"
                const rec = payments.find(
                  (p) =>
                    p.tenantId === t.id &&
                    p.year === viewYear &&
                    p.month === viewMonth &&
                    p.paidAt
                )
                const paidAmount = rec?.amount ?? t.rentAmount

                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        room.dot
                      )}
                    >
                      {t.roomNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{stayLabel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        {paid ? clpFormat(paidAmount) : clpFormat(t.rentAmount)}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          paid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {paid ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {paid ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Footer totals */}
        {(summary.paidTenants.length > 0 || summary.unpaidTenants.length > 0) && (
          <div className="px-4 py-3 bg-secondary/50 border-t border-border flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {summary.unpaidTenants.length > 0
                ? `${summary.unpaidTenants.length} pendiente${summary.unpaidTenants.length > 1 ? "s" : ""} · ${clpFormat(summary.unpaidTenants.reduce((s, t) => s + t.rentAmount, 0))} por cobrar`
                : "Todos los arriendos cobrados"}
            </span>
            <span className="font-bold text-foreground">{clpFormat(summary.grossIncome)}</span>
          </div>
        )}
      </div>

      {/* ── Expenses section ─────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-red-400" aria-hidden="true" />
            <p className="font-bold text-sm text-foreground">Gastos del mes</p>
          </div>
          <button
            onClick={() => setShowExpenseForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
          >
            <Plus size={13} />
            Agregar gasto
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Inline expense form */}
          {showExpenseForm && (
            <ExpenseForm
              year={viewYear}
              month={viewMonth}
              onSaved={() => {
                reload()
                setShowExpenseForm(false)
              }}
              onCancel={() => setShowExpenseForm(false)}
            />
          )}

          {summary.expenses.length === 0 && !showExpenseForm ? (
            <div className="py-8 text-center">
              <ReceiptText size={32} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No hay gastos registrados para este mes.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Usa el botón &ldquo;Agregar gasto&rdquo; para registrar luz, agua, internet, etc.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {summary.expenses
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-secondary/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {EXPENSE_CATEGORY_LABELS[exp.category]}
                        </span>
                        {exp.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            — {exp.description}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{exp.date}</p>
                    </div>
                    <p className="text-sm font-bold text-red-700 shrink-0">
                      {clpFormat(exp.amount)}
                    </p>

                    {confirmDeleteExpId === exp.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-[11px] font-semibold text-white bg-destructive px-2 py-1 rounded-lg hover:opacity-90"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteExpId(null)}
                          className="text-[11px] font-medium text-muted-foreground border border-border px-2 py-1 rounded-lg hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteExpId(exp.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Eliminar gasto"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

              {/* Expenses total footer */}
              {summary.expenses.length > 0 && (
                <div className="flex justify-between items-center px-3 py-2 mt-1 rounded-xl border border-red-200 bg-red-50">
                  <span className="text-xs font-semibold text-red-700">Total gastos</span>
                  <span className="text-sm font-bold text-red-700">
                    {clpFormat(summary.totalExpenses)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Net profit callout ───────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          summary.netProfit >= 0
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        )}
      >
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Resultado neto — {MONTHS_ES[viewMonth - 1]} {viewYear}
          </p>
          <p
            className={cn(
              "text-3xl font-bold",
              summary.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            )}
          >
            {clpFormat(summary.netProfit)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {clpFormat(summary.dailyAvg)}/día · {clpFormat(summary.weeklyAvg)}/semana ·{" "}
            {daysInMonth} días en el mes
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="text-sm font-semibold text-emerald-700">{clpFormat(summary.grossIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">Gastos</p>
          <p className="text-sm font-semibold text-red-700">{clpFormat(summary.totalExpenses)}</p>
        </div>
      </div>
    </main>
  )
}
