"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Search,
  FileDown,
} from "lucide-react"
import { Tenant, PaymentRecord } from "@/lib/types"
import { MONTHS_ES } from "@/lib/constants"
import { ROOM_COLORS } from "@/lib/constants"
import {
  getTenants,
  deleteTenant,
  getPayments,
  markPaymentPaid,
  markPaymentUnpaid,
} from "@/lib/storage"
import { formatDateCL, getPaymentDay } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import TenantForm from "./admin/TenantForm"
import { exportTenantsExcel } from "@/lib/export-excel"

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const reload = useCallback(() => {
    setTenants(getTenants())
    setPayments(getPayments())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function handleEdit(tenant: Tenant) {
    setEditingTenant(tenant)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    deleteTenant(id)
    reload()
    setConfirmDeleteId(null)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  // Payment history timeline: 2 past months + current + 6 future = 9 total
  // Ordered left-to-right: oldest → newest → future
  const PAST_MONTHS = 2
  const FUTURE_MONTHS = 6
  const historyMonths: { year: number; month: number; isPast: boolean; isCurrent: boolean }[] = []
  for (let i = -PAST_MONTHS; i <= FUTURE_MONTHS; i++) {
    const d = new Date(currentYear, currentMonth - 1 + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    historyMonths.push({
      year: y,
      month: m,
      isPast: i < 0,
      isCurrent: i === 0,
    })
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    String(t.roomNumber).includes(search)
  )

  // Sort: active first, then by room number
  const sorted = [...filtered].sort((a, b) => {
    const aActive = !a.checkOutDate || new Date(a.checkOutDate) >= today
    const bActive = !b.checkOutDate || new Date(b.checkOutDate) >= today
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return a.roomNumber - b.roomNumber
  })

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Administración</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tenants.length} inquilino{tenants.length !== 1 ? "s" : ""} registrado
            {tenants.length !== 1 ? "s" : ""} · {sorted.filter(t => !t.checkOutDate || new Date(t.checkOutDate) >= today).length} activo{sorted.filter(t => !t.checkOutDate || new Date(t.checkOutDate) >= today).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30 self-start sm:self-auto"
        >
          <Plus size={16} />
          Agregar inquilino
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o número de pieza..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
        />
      </div>

      {/* Tenant list */}
      {sorted.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {search ? "Sin resultados para la búsqueda." : "No hay inquilinos registrados aún."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((tenant) => {
            const room = ROOM_COLORS[tenant.roomNumber]
            const isActive = !tenant.checkOutDate || new Date(tenant.checkOutDate) >= today
            const isExpanded = expandedId === tenant.id
            const currentPayment = payments.find(
              (p) =>
                p.tenantId === tenant.id &&
                p.year === currentYear &&
                p.month === currentMonth
            )
            const isPaidThisMonth = !!currentPayment?.paidAt

            return (
              <div
                key={tenant.id}
                className={cn(
                  "bg-card rounded-2xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md",
                  room.border
                )}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Room badge */}
                  <span
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white",
                      room.dot
                    )}
                  >
                    {tenant.roomNumber}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {tenant.name}
                      </span>
                      {!isActive && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                          Egresado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Pieza {tenant.roomNumber} · {tenant.nationality} · Día {getPaymentDay(tenant)} · ${tenant.rentAmount.toLocaleString("es-CL")}
                    </p>
                  </div>

                  {/* This month's payment badge */}
                  {isActive && (
                    <span
                      className={cn(
                        "hidden sm:flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0",
                        isPaidThisMonth
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {isPaidThisMonth ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      {isPaidThisMonth ? "Pagó" : "Pendiente"}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(tenant.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleExpand(tenant.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      aria-label={isExpanded ? "Contraer" : "Expandir historial"}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm delete */}
                {confirmDeleteId === tenant.id && (
                  <div className="px-4 py-3 border-t border-destructive/20 bg-red-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700 font-medium">
                      ¿Eliminar a {tenant.name}? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-white hover:opacity-90 transition-opacity"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment history panel */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Historial de pagos
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Clic en un mes activo para marcar / desmarcar
                      </p>
                    </div>

                    {/* Month timeline — scrollable on mobile */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                      {historyMonths.map(({ year, month, isPast, isCurrent }) => {
                        const rec = payments.find(
                          (p) => p.tenantId === tenant.id && p.year === year && p.month === month
                        )
                        const paid = !!rec?.paidAt
                        const monthShort = MONTHS_ES[month - 1].slice(0, 3)

                        if (isPast) {
                          // Past months: display only, not clickable for toggle
                          return (
                            <div
                              key={`${year}-${month}`}
                              title={`${MONTHS_ES[month - 1]} ${year} (mes pasado)`}
                              className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-medium shrink-0 w-16 opacity-50",
                                paid
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : "bg-muted border-border text-muted-foreground"
                              )}
                            >
                              <span className="font-bold">{monthShort}</span>
                              <span className="text-[10px] opacity-80">{year}</span>
                              {paid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {/* Download icon for past month */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  exportTenantsExcel(tenants)
                                }}
                                title="Descargar Excel de este mes"
                                className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors opacity-100"
                              >
                                <FileDown size={11} />
                              </button>
                            </div>
                          )
                        }

                        return (
                          <button
                            key={`${year}-${month}`}
                            title={`${MONTHS_ES[month - 1]} ${year}${isCurrent ? " (mes actual)" : ""}`}
                            onClick={() => {
                              if (paid) {
                                markPaymentUnpaid(tenant.id, year, month)
                              } else {
                                markPaymentPaid(tenant.id, year, month, tenant.rentAmount)
                              }
                              reload()
                            }}
                            className={cn(
                              "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all hover:scale-105 active:scale-95 shrink-0 w-16",
                              paid
                                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
                              isCurrent && "ring-2 ring-primary ring-offset-1 font-bold"
                            )}
                          >
                            <span className="font-bold">{monthShort}</span>
                            <span className="text-[10px] opacity-80">{year}</span>
                            {paid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {isCurrent && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                                hoy
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Quick info */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs border-t border-border pt-3">
                      <InfoPair label="Llegada" value={formatDateCL(tenant.checkInDate)} />
                      <InfoPair
                        label="Salida"
                        value={tenant.checkOutDate ? formatDateCL(tenant.checkOutDate) : "Indefinido"}
                      />
                      <InfoPair label="Teléfono" value={tenant.phone || "—"} />
                      <InfoPair label="Emergencia" value={tenant.emergencyPhone || "—"} />
                      <InfoPair
                        label="Estadía"
                        value={
                          tenant.stayType === "indefinido"
                            ? "Indefinido"
                            : tenant.stayType === "meses"
                            ? "Por meses"
                            : "Por días/noches"
                        }
                      />
                      <InfoPair label="Día de pago" value={`Día ${getPaymentDay(tenant)}`} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tenant form modal */}
      {showForm && (
        <TenantForm
          existing={editingTenant}
          onClose={() => {
            setShowForm(false)
            setEditingTenant(null)
          }}
          onSaved={reload}
        />
      )}
    </main>
  )
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
