"use client"

import { useEffect, useState } from "react"
import { User, BedDouble, CheckCircle2, Clock, Wifi, Tv, BatteryCharging, DoorOpen, FileDown } from "lucide-react"
import { Tenant } from "@/lib/types"
import { AMENITY_LABELS } from "@/lib/types"
import { ROOM_COLORS, ROOM_NUMBERS, MONTHS_ES, VACANCY_COLOR } from "@/lib/constants"
import { getTenants, getPaymentForMonth } from "@/lib/storage"
import { formatDateCL, getPaymentDay } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { exportTenantsWord } from "@/lib/export-word"

const AMENITY_ICONS: Partial<Record<string, React.ElementType>> = {
  television: Tv,
  internet: Wifi,
  luz: BatteryCharging,
}

export default function RoomsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])

  useEffect(() => {
    setTenants(getTenants())
  }, [])

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  function getActiveTenantForRoom(roomNumber: number): Tenant | null {
    const occupants = tenants.filter((t) => {
      if (t.roomNumber !== roomNumber) return false
      if (!t.checkOutDate) return true
      return t.checkOutDate >= today.toISOString().slice(0, 10)
    })
    if (occupants.length === 0) return null
    return occupants.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }

  const occupiedCount = ROOM_NUMBERS.filter((n) => getActiveTenantForRoom(n) !== null).length
  const occupancyPct = Math.round((occupiedCount / 11) * 100)

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Habitaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vista general de las 11 piezas · {MONTHS_ES[currentMonth - 1]} {currentYear}
          </p>
        </div>
        <button
          onClick={() => exportTenantsWord(tenants, `${MONTHS_ES[currentMonth - 1]} ${currentYear}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-primary/30 self-start sm:self-auto"
        >
          <FileDown size={16} />
          Exportar Word
        </button>
      </div>

      {/* ── Occupancy summary card ───────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-6">
          <StatBlock label="Ocupadas" value={occupiedCount} accent />
          <div className="w-px h-10 bg-border hidden sm:block" />
          <StatBlock label="Disponibles" value={11 - occupiedCount} />
          <div className="w-px h-10 bg-border hidden sm:block" />
          <StatBlock label="Total piezas" value={11} />

          {/* Occupancy bar */}
          <div className="flex-1 min-w-[180px] hidden sm:block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ocupación</span>
              <span className="text-xs font-bold text-foreground">{occupancyPct}%</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${occupancyPct}%` }}
                role="progressbar"
                aria-valuenow={occupiedCount}
                aria-valuemin={0}
                aria-valuemax={11}
                aria-label="Ocupación del recinto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Room grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ROOM_NUMBERS.map((num) => {
          const tenant = getActiveTenantForRoom(num)
          return tenant ? (
            <OccupiedRoomCard key={num} tenant={tenant} year={currentYear} month={currentMonth} />
          ) : (
            <VacantRoomCard key={num} roomNumber={num} />
          )
        })}
      </div>
    </main>
  )
}

// ─── Stat block ───────────────────────────────────────────────────────────────
function StatBlock({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn("text-2xl font-extrabold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Occupied Room Card ───────────────────────────────────────────────────────
function OccupiedRoomCard({ tenant, year, month }: { tenant: Tenant; year: number; month: number }) {
  const room = ROOM_COLORS[tenant.roomNumber]
  const payment = getPaymentForMonth(tenant.id, year, month)
  const isPaid = !!payment?.paidAt
  const payDay = getPaymentDay(tenant)
  const shownAmenities = tenant.amenities.slice(0, 4)

  return (
    <article
      className={cn(
        "rounded-2xl border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-card",
        room.border
      )}
    >
      {/* Color header band */}
      <div className={cn("px-4 pt-4 pb-3", room.bg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                room.dot
              )}
            >
              <User size={16} className="text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn("font-bold text-sm leading-tight truncate", room.text)}>
                {tenant.name}
              </p>
              <p className={cn("text-xs opacity-60 truncate", room.text)}>
                {tenant.nationality}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg",
              room.bg, room.text, "border", room.border
            )}
          >
            P{tenant.roomNumber}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Rent + status */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-extrabold text-foreground tracking-tight">
              ${tenant.rentAmount.toLocaleString("es-CL")}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/mes</span>
          </div>
          {isPaid ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={10} />
              Pagado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              <Clock size={10} />
              Pendiente
            </span>
          )}
        </div>

        {/* Dates + pay day */}
        <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2.5">
          <div className="flex justify-between">
            <span>Llegada</span>
            <span className="font-medium text-foreground">{formatDateCL(tenant.checkInDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Salida</span>
            <span className="font-medium text-foreground">
              {tenant.checkOutDate ? formatDateCL(tenant.checkOutDate) : "Indefinido"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Paga el día</span>
            <span className="font-bold text-primary">{payDay}</span>
          </div>
        </div>

        {/* Amenities */}
        {shownAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {shownAmenities.map((a) => {
              const Icon = AMENITY_ICONS[a]
              return (
                <span
                  key={a}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border",
                    room.bg, room.text, room.border
                  )}
                >
                  {Icon && <Icon size={9} aria-hidden="true" />}
                  {AMENITY_LABELS[a]}
                </span>
              )
            })}
            {tenant.amenities.length > 4 && (
              <span className="text-[11px] text-muted-foreground self-center">
                +{tenant.amenities.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Vacant Room Card ─────────────────────────────────────────────────────────
function VacantRoomCard({ roomNumber }: { roomNumber: number }) {
  return (
    <article className="rounded-2xl border border-dashed border-emerald-300 overflow-hidden shadow-sm bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="px-4 pt-4 pb-3 bg-emerald-50">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center">
            <BedDouble size={16} className="text-emerald-600" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-sm text-emerald-800">Disponible</p>
            <p className="text-xs text-emerald-600">Pieza {roomNumber}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
        <DoorOpen size={14} className="text-muted-foreground/50" />
        Esta pieza está libre y lista para arrendar.
      </div>
    </article>
  )
}
