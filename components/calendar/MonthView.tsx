"use client"

import { Tenant } from "@/lib/types"
import { ROOM_COLORS, DAYS_ES } from "@/lib/constants"
import { getMonthGrid, toDateStr, isTenantPaymentDay } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface MonthViewProps {
  year: number
  month: number // 1-12
  tenants: Tenant[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export default function MonthView({
  year,
  month,
  tenants,
  selectedDate,
  onSelectDate,
}: MonthViewProps) {
  const grid = getMonthGrid(year, month)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedStr = toDateStr(selectedDate)

  function getPayingTenants(date: Date): Tenant[] {
    const dateStr = toDateStr(date)
    return tenants.filter((t) => isTenantPaymentDay(t, dateStr))
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_ES.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          if (!date) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-24 md:h-28 border-b border-r border-border/50 bg-muted/20"
              />
            )
          }

          const dateStr = toDateStr(date)
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          const isPast = date < today && !isToday
          const isSelected = dateStr === selectedStr
          const paying = getPayingTenants(date)

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={cn(
                "h-24 md:h-28 border-b border-r border-border/50 p-1.5 text-left flex flex-col transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isPast && "bg-muted/40",
                isSelected && "bg-accent/60 ring-2 ring-inset ring-primary/30"
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1 shrink-0",
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : isPast
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {date.getDate()}
              </span>

              {/* Tenant chips */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {paying.slice(0, 3).map((t) => {
                  const room = ROOM_COLORS[t.roomNumber]
                  return (
                    <span
                      key={t.id}
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded truncate leading-tight",
                        room.bg,
                        room.text,
                        isPast && "opacity-50"
                      )}
                    >
                      P{t.roomNumber} · {t.name.split(" ")[0]}
                    </span>
                  )
                })}
                {paying.length > 3 && (
                  <span className="text-[10px] text-muted-foreground font-medium px-1">
                    +{paying.length - 3} más
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
