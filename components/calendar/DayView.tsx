"use client"

import { CheckCircle2, Clock } from "lucide-react"
import { Tenant } from "@/lib/types"
import { ROOM_COLORS, DAYS_FULL_ES, MONTHS_ES } from "@/lib/constants"
import { getPaymentForMonth } from "@/lib/storage"
import { toDateStr, isTenantPaymentDay } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface DayViewProps {
  date: Date
  tenants: Tenant[]
}

export default function DayView({ date, tenants }: DayViewProps) {
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const dayOfWeek = DAYS_FULL_ES[date.getDay()]
  const monthName = MONTHS_ES[date.getMonth()]

  const dateStr = toDateStr(date)
  const paying = tenants.filter((t) => isTenantPaymentDay(t, dateStr))

  const today = new Date()
  const isToday =
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year === today.getFullYear()

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Day header */}
      <div className="px-6 py-5 border-b border-border bg-secondary/40">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-5xl font-bold",
              isToday ? "text-primary" : "text-foreground"
            )}
          >
            {day}
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">{dayOfWeek}</span>
            <span className="text-sm text-muted-foreground">
              {monthName} {year}
              {isToday && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                  Hoy
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Payment list */}
      <div className="p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Pagos que vencen este día
        </h3>
        {paying.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No hay pagos venciendo este día.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paying.map((t) => {
              const room = ROOM_COLORS[t.roomNumber]
              const payment = getPaymentForMonth(t.id, year, month)
              const isPaid = !!payment?.paidAt

              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border",
                    room.bg,
                    room.border
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white",
                      room.dot
                    )}
                  >
                    {t.roomNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-semibold text-sm", room.text)}>{t.name}</p>
                    <p className={cn("text-xs opacity-70", room.text)}>
                      Pieza {t.roomNumber} · {t.nationality} · {t.phone}
                    </p>
                    <p className={cn("text-sm font-bold mt-0.5", room.text)}>
                      ${t.rentAmount.toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isPaid ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <CheckCircle2 size={13} />
                        Pagado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                        <Clock size={13} />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
