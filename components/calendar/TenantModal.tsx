"use client"

import { X, CheckCircle2, Clock, Phone, Briefcase, Globe, CalendarCheck, CalendarX, Home, Tv, Heart } from "lucide-react"
import { Tenant, PaymentRecord, MARITAL_STATUS_LABELS, MaritalStatus } from "@/lib/types"
import { AMENITY_LABELS, ALL_AMENITIES } from "@/lib/types"
import { ROOM_COLORS } from "@/lib/constants"
import { formatDateCL, getPaymentDay } from "@/lib/date-utils"
import { markPaymentPaid, markPaymentUnpaid, getPaymentForMonth } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface TenantModalProps {
  tenant: Tenant
  year: number
  month: number // 1-12
  onClose: () => void
  onPaymentChange: () => void
}

const PHONE_COUNTRIES_MAP: Record<string, string> = {
  CL: "+56 ", VE: "+58 ", PE: "+51 ", CO: "+57 ", BO: "+591 ",
  AR: "+54 ", ES: "+34 ", US: "+1 ", GB: "+44 ", BR: "+55 ", MX: "+52 ",
}

export default function TenantModal({
  tenant,
  year,
  month,
  onClose,
  onPaymentChange,
}: TenantModalProps) {
  const room = ROOM_COLORS[tenant.roomNumber]
  const payment = getPaymentForMonth(tenant.id, year, month)
  const isPaid = !!payment?.paidAt

  function handleTogglePayment() {
    if (isPaid) {
      markPaymentUnpaid(tenant.id, year, month)
    } else {
      markPaymentPaid(tenant.id, year, month, tenant.rentAmount)
    }
    onPaymentChange()
  }

  const stayLabel =
    tenant.stayType === "indefinido"
      ? "Plazo indefinido"
      : tenant.stayType === "meses"
      ? "Por meses"
      : "Por días / noches"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={cn("px-5 py-4 flex items-start justify-between", room.bg)}>
          <div>
            <div className={cn("text-xs font-semibold uppercase tracking-wider mb-1", room.text)}>
              Pieza {tenant.roomNumber}
            </div>
            <h2
              id="tenant-modal-title"
              className={cn("text-xl font-bold leading-tight text-balance", room.text)}
            >
              {tenant.name}
            </h2>
            <div className={cn("text-sm mt-0.5", room.text, "opacity-70")}>
              {tenant.rut}
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "ml-4 p-1.5 rounded-lg transition-colors",
              room.text,
              "hover:bg-black/10"
            )}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Payment status banner */}
        <div
          className={cn(
            "px-5 py-2.5 flex items-center justify-between text-sm font-medium",
            isPaid
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          )}
        >
          <div className="flex items-center gap-2">
            {isPaid ? (
              <CheckCircle2 size={16} />
            ) : (
              <Clock size={16} />
            )}
            <span>
              {isPaid
                ? `Pagó — ${payment?.paidAt ? formatDateCL(payment.paidAt.slice(0, 10)) : ""}`
                : "Pago pendiente este mes"}
            </span>
          </div>
          <button
            onClick={handleTogglePayment}
            className={cn(
              "text-xs px-3 py-1 rounded-full font-semibold transition-colors",
              isPaid
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            )}
          >
            {isPaid ? "Desmarcar" : "Marcar como pagado"}
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Personal info */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Información personal
            </h3>
            <div className="space-y-2">
              <InfoRow icon={Globe} label="Nacionalidad" value={tenant.nationality} />
              {tenant.maritalStatus && (
                <InfoRow
                  icon={Heart}
                  label="Estado civil"
                  value={MARITAL_STATUS_LABELS[tenant.maritalStatus as MaritalStatus]}
                />
              )}
              <InfoRow icon={Briefcase} label="Trabajo" value={tenant.occupation || "No especificado"} />
              <InfoRow
                icon={Phone}
                label="Teléfono"
                value={
                  tenant.phone
                    ? `${PHONE_COUNTRIES_MAP[tenant.phoneCountry ?? "CL"] ?? ""}${tenant.phone}`
                    : "No registrado"
                }
              />
              <InfoRow
                icon={Phone}
                label={`Emergencia${tenant.emergencyContactName ? ` · ${tenant.emergencyContactName}` : ""}`}
                value={
                  tenant.emergencyPhone
                    ? `${PHONE_COUNTRIES_MAP[tenant.emergencyPhoneCountry ?? "CL"] ?? ""}${tenant.emergencyPhone}`
                    : "No registrado"
                }
              />
            </div>
          </section>

          {/* Stay info */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Estadía
            </h3>
            <div className="space-y-2">
              <InfoRow icon={CalendarCheck} label="Llegada" value={formatDateCL(tenant.checkInDate)} />
              <InfoRow
                icon={CalendarX}
                label="Salida"
                value={tenant.checkOutDate ? formatDateCL(tenant.checkOutDate) : "Indefinido"}
              />
              <InfoRow icon={Home} label="Tipo de estadía" value={stayLabel} />
              <InfoRow
                icon={CalendarCheck}
                label="Día de pago mensual"
                value={`Día ${getPaymentDay(tenant)} de cada mes`}
              />
            </div>
          </section>

          {/* Room amenities */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Lo que incluye la pieza
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ALL_AMENITIES.map((a) => {
                const included = tenant.amenities.includes(a)
                return (
                  <span
                    key={a}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                      included
                        ? `${room.bg} ${room.text}`
                        : "bg-muted text-muted-foreground line-through opacity-40"
                    )}
                  >
                    {included && <Tv size={10} aria-hidden="true" />}
                    {AMENITY_LABELS[a]}
                  </span>
                )
              })}
            </div>
          </section>

          {/* Rent */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Arriendo
            </h3>
            <p className="text-2xl font-bold text-foreground">
              ${tenant.rentAmount.toLocaleString("es-CL")}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ mes</span>
            </p>
          </section>

          {/* Notes */}
          {tenant.notes && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Notas
              </h3>
              <p className="text-sm text-foreground leading-relaxed bg-muted rounded-lg px-3 py-2">
                {tenant.notes}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground font-medium break-words">{value}</span>
      </div>
    </div>
  )
}
