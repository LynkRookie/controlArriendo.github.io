"use client"

import { Tenant } from "@/lib/types"
import { ROOM_COLORS, DAYS_ES, MONTHS_ES } from "@/lib/constants"
import { getWeekDays, toDateStr, isTenantPaymentDay } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  currentDate: Date
  tenants: Tenant[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export default function WeekView({
  currentDate,
  tenants,
  selectedDate,
  onSelectDate,
}: WeekViewProps) {
  const days = getWeekDays(currentDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedStr = toDateStr(selectedDate)

  function getPayingTenants(date: Date): Tenant[] {
    const dateStr = toDateStr(date)
    return tenants.filter((t) => isTenantPaymentDay(t, dateStr))
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dateStr = toDateStr(date)
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          const isSelected = dateStr === selectedStr
          const paying = getPayingTenants(date)

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex flex-col items-center border-r border-border/50 p-2 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[200px]",
                isSelected && "bg-accent/60 ring-2 ring-inset ring-primary/30"
              )}
            >
              {/* Day label */}
              <div className="flex flex-col items-center mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {DAYS_ES[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {MONTHS_ES[date.getMonth()].slice(0, 3)}
                </span>
              </div>

              {/* Payment events */}
              <div className="w-full flex flex-col gap-1.5">
                {paying.map((t) => {
                  const room = ROOM_COLORS[t.roomNumber]
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left",
                        room.bg,
                        room.border,
                        "border"
                      )}
                    >
                      <p className={cn("text-[11px] font-bold leading-tight", room.text)}>
                        P{t.roomNumber}
                      </p>
                      <p className={cn("text-[10px] leading-tight truncate", room.text, "opacity-80")}>
                        {t.name.split(" ")[0]}
                      </p>
                    </div>
                  )
                })}
                {paying.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/40 text-center pt-2">—</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
