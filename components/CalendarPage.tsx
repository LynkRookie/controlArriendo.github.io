"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Download, Calendar, Users, AlertCircle } from "lucide-react"
import { CalendarView, Tenant } from "@/lib/types"
import { MONTHS_ES, ROOM_NUMBERS } from "@/lib/constants"
import { getTenants } from "@/lib/storage"
import { getWeekDays, toDateStr, isTenantPaymentDay } from "@/lib/date-utils"
import { exportTenantsExcel } from "@/lib/export-excel"
import { cn } from "@/lib/utils"
import MonthView from "./calendar/MonthView"
import WeekView from "./calendar/WeekView"
import DayView from "./calendar/DayView"
import DayPanel from "./calendar/DayPanel"

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => {
    setTenants(getTenants())
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function navigate(dir: 1 | -1) {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (view === "month") d.setMonth(d.getMonth() + dir)
      else if (view === "week") d.setDate(d.getDate() + dir * 7)
      else d.setDate(d.getDate() + dir)
      return d
    })
  }

  function goToday() {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setCurrentDate(date)
  }

  function getTitle(): string {
    if (view === "month") {
      return `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    if (view === "week") {
      const days = getWeekDays(currentDate)
      const first = days[0]
      const last = days[6]
      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} – ${last.getDate()} de ${MONTHS_ES[first.getMonth()]} ${first.getFullYear()}`
      }
      return `${first.getDate()} ${MONTHS_ES[first.getMonth()].slice(0, 3)} – ${last.getDate()} ${MONTHS_ES[last.getMonth()].slice(0, 3)} ${last.getFullYear()}`
    }
    return `${currentDate.getDate()} de ${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const activeTenants = tenants.filter((t) => {
    if (!t.checkOutDate) return true
    return t.checkOutDate >= new Date().toISOString().slice(0, 10)
  })

  // Stats
  const today = new Date()
  const todayStr = toDateStr(today)
  const payingToday = activeTenants.filter((t) => isTenantPaymentDay(t, todayStr))
  const occupiedRooms = ROOM_NUMBERS.filter((n) =>
    activeTenants.some((t) => t.roomNumber === n)
  ).length

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-5">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Calendario de Pagos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {MONTHS_ES[today.getMonth()]} {today.getFullYear()} · {activeTenants.length} residente{activeTenants.length !== 1 ? "s" : ""} activo{activeTenants.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Export button */}
        <button
          onClick={() => exportTenantsExcel(tenants)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30 self-start sm:self-auto"
        >
          <Download size={15} aria-hidden="true" />
          Exportar Excel
        </button>
      </div>

      {/* ── Quick stat pills ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <StatPill
          icon={Users}
          label="Ocupadas"
          value={`${occupiedRooms} / 11`}
          color="primary"
        />
        <StatPill
          icon={Calendar}
          label="Pagan hoy"
          value={payingToday.length === 0 ? "Ninguno" : String(payingToday.length)}
          color={payingToday.length > 0 ? "amber" : "muted"}
        />
        <StatPill
          icon={AlertCircle}
          label="Disponibles"
          value={`${11 - occupiedRooms}`}
          color="green"
        />
      </div>

      {/* ── Calendar toolbar ─────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-3 justify-between px-4 py-3 border-b border-border">
          {/* View selector */}
          <div
            className="flex items-center bg-secondary rounded-xl p-1 gap-0.5"
            role="tablist"
            aria-label="Vista del calendario"
          >
            {(["month", "week", "day"] as CalendarView[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  view === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
              </button>
            ))}
          </div>

          {/* Nav + title */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Anterior"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="text-sm font-semibold text-foreground min-w-[190px] text-center tabular-nums">
              {getTitle()}
            </span>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Siguiente"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Today */}
          <button
            onClick={goToday}
            className="px-4 py-1.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Hoy
          </button>
        </div>

        {/* Calendar body */}
        <div className="p-0 overflow-hidden rounded-b-2xl">
          {view === "month" && (
            <MonthView
              year={currentDate.getFullYear()}
              month={currentDate.getMonth() + 1}
              tenants={activeTenants}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              tenants={activeTenants}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === "day" && (
            <DayView date={currentDate} tenants={activeTenants} />
          )}
        </div>
      </div>

      {/* Day detail panel */}
      {(view === "month" || view === "week") && (
        <DayPanel
          key={tick}
          selectedDate={selectedDate}
          tenants={activeTenants}
          onPaymentChange={reload}
        />
      )}
    </main>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

type PillColor = "primary" | "amber" | "green" | "muted"

const PILL_STYLES: Record<PillColor, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  green:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  muted:   "bg-muted text-muted-foreground border-border",
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: PillColor
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium",
        PILL_STYLES[color]
      )}
    >
      <Icon size={15} aria-hidden="true" />
      <span className="text-xs opacity-70">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
