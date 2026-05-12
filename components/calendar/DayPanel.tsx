"use client"

import { useState } from "react"
import { CheckCircle2, Clock, ChevronRight } from "lucide-react"
import { Tenant } from "@/lib/types"
import { ROOM_COLORS, DAYS_FULL_ES, MONTHS_ES } from "@/lib/constants"
import { getPaymentForMonth } from "@/lib/storage"
import { cn } from "@/lib/utils"
import TenantModal from "./TenantModal"

interface DayPanelProps {
  selectedDate: Date
  tenants: Tenant[]
  onPaymentChange: () => void
}

export default function DayPanel({ selectedDate, tenants, onPaymentChange }: DayPanelProps) {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth() + 1
  const day = selectedDate.getDate()
  const dayOfWeek = DAYS_FULL_ES[selectedDate.getDay()]
  const monthName = MONTHS_ES[selectedDate.getMonth()]

  // Use the same isTenantPaymentDay helper used in MonthView for consistency
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const payingToday = tenants.filter((t) => {
    const payDay = t.useArrivalDayForPayment
      ? parseInt(t.checkInDate.split("-")[2], 10)
      : (t.customPaymentDay ?? parseInt(t.checkInDate.split("-")[2], 10))
    if (payDay !== day) return false
    if (dateStr < t.checkInDate) return false
    if (t.checkOutDate && dateStr > t.checkOutDate) return false
    return true
  })

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-primary" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm text-foreground">
                {dayOfWeek}, {day} de {monthName} {year}
              </p>
              <p className="text-xs text-muted-foreground">
                {payingToday.length === 0
                  ? "Sin vencimientos este día"
                  : `${payingToday.length} vencimiento${payingToday.length > 1 ? "s" : ""} de pago`}
              </p>
            </div>
          </div>
          {payingToday.length > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {payingToday.length} pago{payingToday.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {payingToday.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted-foreground text-sm">
                No hay pagos que vencen este día.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Selecciona otro día en el calendario.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {payingToday.map((tenant) => {
                const room = ROOM_COLORS[tenant.roomNumber]
                const payment = getPaymentForMonth(tenant.id, year, month)
                const isPaid = !!payment?.paidAt

                return (
                  <button
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all",
                      "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] text-left",
                      room.bg, room.border
                    )}
                  >
                    {/* Room badge */}
                    <span
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm",
                        room.dot, "text-white"
                      )}
                    >
                      {tenant.roomNumber}
                    </span>

                    {/* Tenant info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm truncate", room.text)}>
                        {tenant.name}
                      </p>
                      <p className={cn("text-xs opacity-60 truncate", room.text)}>
                        ${tenant.rentAmount.toLocaleString("es-CL")}/mes
                      </p>
                    </div>

                    {/* Payment status */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isPaid ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} />
                          Pagado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                          <Clock size={10} />
                          Pendiente
                        </span>
                      )}
                      <ChevronRight size={13} className={cn("opacity-40", room.text)} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tenant modal */}
      {selectedTenant && (
        <TenantModal
          tenant={selectedTenant}
          year={year}
          month={month}
          onClose={() => setSelectedTenant(null)}
          onPaymentChange={() => {
            onPaymentChange()
            setSelectedTenant({ ...selectedTenant })
          }}
        />
      )}
    </>
  )
}
