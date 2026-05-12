"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import {
  Tenant,
  Amenity,
  StayType,
  MaritalStatus,
  ALL_AMENITIES,
  AMENITY_LABELS,
  MARITAL_STATUS_LABELS,
} from "@/lib/types"
import { ROOM_NUMBERS, ROOM_COLORS } from "@/lib/constants"
import { addTenant, updateTenant } from "@/lib/storage"
import { cn } from "@/lib/utils"

// ─── Phone country options ────────────────────────────────────────────────────
const PHONE_COUNTRIES = [
  { code: "CL", flag: "🇨🇱", prefix: "+56", label: "Chile" },
  { code: "VE", flag: "🇻🇪", prefix: "+58", label: "Venezuela" },
  { code: "PE", flag: "🇵🇪", prefix: "+51", label: "Perú" },
  { code: "CO", flag: "🇨🇴", prefix: "+57", label: "Colombia" },
  { code: "BO", flag: "🇧🇴", prefix: "+591", label: "Bolivia" },
  { code: "AR", flag: "🇦🇷", prefix: "+54", label: "Argentina" },
  { code: "ES", flag: "🇪🇸", prefix: "+34", label: "España" },
  { code: "US", flag: "🇺🇸", prefix: "+1", label: "USA / Canadá" },
  { code: "GB", flag: "🇬🇧", prefix: "+44", label: "Reino Unido" },
  { code: "BR", flag: "🇧🇷", prefix: "+55", label: "Brasil" },
  { code: "MX", flag: "🇲🇽", prefix: "+52", label: "México" },
] as const

interface TenantFormProps {
  existing?: Tenant | null
  onClose: () => void
  onSaved: () => void
}

const INITIAL: Omit<Tenant, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  rut: "",
  nationality: "",
  occupation: "",
  maritalStatus: "",
  phone: "",
  phoneCountry: "CL",
  emergencyPhone: "",
  emergencyPhoneCountry: "CL",
  emergencyContactName: "",
  roomNumber: 1,
  checkInDate: new Date().toISOString().slice(0, 10),
  checkOutDate: null,
  stayType: "indefinido",
  useArrivalDayForPayment: true,
  customPaymentDay: null,
  rentAmount: 0,
  amenities: [],
  notes: "",
}

// ─── RUT formatter ────────────────────────────────────────────────────────────
function formatRut(raw: string): string {
  // Remove everything except digits and K/k
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase()
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  // Add dots every 3 digits from right
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted}-${dv}`
}

// ─── CLP currency formatter ───────────────────────────────────────────────────
function formatCLP(value: number): string {
  if (!value) return ""
  return value.toLocaleString("es-CL")
}

function parseCLP(str: string): number {
  // Remove everything except digits
  const digits = str.replace(/[^0-9]/g, "")
  return digits ? parseInt(digits, 10) : 0
}

export default function TenantForm({ existing, onClose, onSaved }: TenantFormProps) {
  const [form, setForm] = useState<Omit<Tenant, "id" | "createdAt" | "updatedAt">>(
    existing
      ? {
          name: existing.name,
          rut: existing.rut,
          nationality: existing.nationality,
          occupation: existing.occupation,
          maritalStatus: existing.maritalStatus ?? "",
          phone: existing.phone,
          phoneCountry: existing.phoneCountry ?? "CL",
          emergencyPhone: existing.emergencyPhone,
          emergencyPhoneCountry: existing.emergencyPhoneCountry ?? "CL",
          emergencyContactName: existing.emergencyContactName,
          roomNumber: existing.roomNumber,
          checkInDate: existing.checkInDate,
          checkOutDate: existing.checkOutDate,
          stayType: existing.stayType,
          useArrivalDayForPayment: existing.useArrivalDayForPayment,
          customPaymentDay: existing.customPaymentDay,
          rentAmount: existing.rentAmount,
          amenities: existing.amenities,
          notes: existing.notes,
        }
      : { ...INITIAL }
  )
  // Controlled display string for rent (formatted)
  const [rentDisplay, setRentDisplay] = useState(existing ? formatCLP(existing.rentAmount) : "")
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {}
    if (!form.name.trim()) e.name = "El nombre es obligatorio"
    if (!form.checkInDate) e.checkInDate = "La fecha de llegada es obligatoria"
    if (form.rentAmount <= 0) e.rentAmount = "El arriendo debe ser mayor a 0"
    if (!form.useArrivalDayForPayment) {
      if (!form.customPaymentDay || form.customPaymentDay < 1 || form.customPaymentDay > 31) {
        e.customPaymentDay = "Ingresa un día válido (1-31)"
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const now = new Date().toISOString()
    if (existing) {
      updateTenant({ ...existing, ...form, updatedAt: now })
    } else {
      addTenant({
        id: crypto.randomUUID(),
        ...form,
        createdAt: now,
        updatedAt: now,
      })
    }
    onSaved()
    onClose()
  }

  function toggleAmenity(a: Amenity) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }))
  }

  // Derive the arrival day number directly from the string (no Date constructor to avoid TZ bug)
  const arrivalDay = form.checkInDate
    ? parseInt(form.checkInDate.split("-")[2], 10)
    : null

  const room = ROOM_COLORS[form.roomNumber]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={cn("px-6 py-4 flex items-center justify-between", room.bg)}>
          <h2 id="form-title" className={cn("text-lg font-bold", room.text)}>
            {existing ? "Editar inquilino" : "Agregar nuevo inquilino"}
          </h2>
          <button
            onClick={onClose}
            className={cn("p-1.5 rounded-lg hover:bg-black/10 transition-colors", room.text)}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Personal ─────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Información personal
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Nombre */}
              <Field label="Nombre completo *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez Soto"
                  className={inputClass(!!errors.name)}
                />
              </Field>

              {/* RUT — formatted on-the-fly */}
              <Field label="RUT / Documento">
                <input
                  type="text"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: formatRut(e.target.value) })}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  className={inputClass(false)}
                />
              </Field>

              {/* Nacionalidad */}
              <Field label="Nacionalidad">
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="Ej: Chilena, Venezolana..."
                  className={inputClass(false)}
                />
              </Field>

              {/* Ocupación */}
              <Field label="Ocupación / Trabajo">
                <input
                  type="text"
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  placeholder="Ej: Construcción, Comercio..."
                  className={inputClass(false)}
                />
              </Field>

              {/* Estado civil — full width */}
              <Field label="Estado civil" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() =>
                        setForm({ ...form, maritalStatus: form.maritalStatus === s ? "" : s })
                      }
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                        form.maritalStatus === s
                          ? `${room.dot} text-white border-transparent shadow-sm`
                          : "bg-muted text-muted-foreground border-transparent hover:bg-secondary"
                      )}
                    >
                      {MARITAL_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Teléfono */}
              <Field label="Teléfono">
                <PhoneInput
                  value={form.phone}
                  country={form.phoneCountry}
                  onChange={(phone) => setForm({ ...form, phone })}
                  onCountryChange={(c) => setForm({ ...form, phoneCountry: c })}
                />
              </Field>

              {/* Vacío para mantener grid */}
              <div className="hidden sm:block" />

              {/* Contacto emergencia — nombre y teléfono en misma fila */}
              <Field label="Contacto de emergencia" className="sm:col-span-2">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={form.emergencyContactName}
                    onChange={(e) =>
                      setForm({ ...form, emergencyContactName: e.target.value })
                    }
                    placeholder="Nombre del familiar"
                    className={cn(inputClass(false), "flex-1 min-w-0")}
                  />
                  <div className="flex-1 min-w-0">
                    <PhoneInput
                      value={form.emergencyPhone}
                      country={form.emergencyPhoneCountry}
                      onChange={(p) => setForm({ ...form, emergencyPhone: p })}
                      onCountryChange={(c) =>
                        setForm({ ...form, emergencyPhoneCountry: c })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Izquierda: nombre · Derecha: teléfono
                </p>
              </Field>
            </div>
          </fieldset>

          {/* ── Pieza ────────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pieza
            </legend>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número de pieza *
              </label>
              <div className="flex flex-wrap gap-2">
                {ROOM_NUMBERS.map((n) => {
                  const c = ROOM_COLORS[n]
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setForm({ ...form, roomNumber: n })}
                      className={cn(
                        "w-10 h-10 rounded-full text-sm font-bold transition-all border-2",
                        form.roomNumber === n
                          ? `${c.dot} text-white border-transparent scale-110 shadow-md`
                          : `${c.bg} ${c.text} ${c.border} hover:scale-105`
                      )}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          </fieldset>

          {/* ── Estadía ──────────────────────────────────────── */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estadía y fechas
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha de llegada *" error={errors.checkInDate}>
                <input
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
                  className={inputClass(!!errors.checkInDate)}
                />
              </Field>
              <Field label="Fecha de salida (vacío = indefinido)">
                <input
                  type="date"
                  value={form.checkOutDate ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, checkOutDate: e.target.value || null })
                  }
                  className={inputClass(false)}
                />
              </Field>
              <Field label="Tipo de estadía">
                <select
                  value={form.stayType}
                  onChange={(e) =>
                    setForm({ ...form, stayType: e.target.value as StayType })
                  }
                  className={inputClass(false)}
                >
                  <option value="indefinido">Plazo indefinido</option>
                  <option value="meses">Por meses</option>
                  <option value="dias">Por días / noches</option>
                </select>
              </Field>

              {/* Arriendo mensual — formatted CLP */}
              <Field label="Arriendo mensual (CLP) *" error={errors.rentAmount}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={rentDisplay}
                    onChange={(e) => {
                      const raw = e.target.value
                      const num = parseCLP(raw)
                      setForm({ ...form, rentAmount: num })
                      setRentDisplay(num ? formatCLP(num) : "")
                    }}
                    placeholder="190.000"
                    className={cn(inputClass(!!errors.rentAmount), "pl-7")}
                  />
                </div>
              </Field>
            </div>
          </fieldset>

          {/* ── Día de pago ───────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Día de pago mensual
            </legend>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="payDay"
                  checked={form.useArrivalDayForPayment}
                  onChange={() =>
                    setForm({ ...form, useArrivalDayForPayment: true, customPaymentDay: null })
                  }
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">
                  Usar el mismo día que llegó{" "}
                  {arrivalDay ? (
                    <span className="font-semibold">(día {arrivalDay} del mes)</span>
                  ) : (
                    <span className="text-muted-foreground">(ingresa fecha de llegada)</span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="payDay"
                  checked={!form.useArrivalDayForPayment}
                  onChange={() => setForm({ ...form, useArrivalDayForPayment: false })}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">Definir día personalizado</span>
              </label>
              {!form.useArrivalDayForPayment && (
                <Field
                  label="Día del mes (1-31)"
                  error={errors.customPaymentDay}
                  className="pl-6"
                >
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.customPaymentDay ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        customPaymentDay: Number(e.target.value) || null,
                      })
                    }
                    placeholder="Ej: 5"
                    className={cn(inputClass(!!errors.customPaymentDay), "max-w-[120px]")}
                  />
                </Field>
              )}
            </div>
          </fieldset>

          {/* ── Amenidades ───────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lo que incluye la pieza
            </legend>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map((a) => {
                const included = form.amenities.includes(a)
                const c = ROOM_COLORS[form.roomNumber]
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      included
                        ? `${c.bg} ${c.text} ${c.border} shadow-sm`
                        : "bg-muted text-muted-foreground border-transparent hover:bg-secondary"
                    )}
                  >
                    {AMENITY_LABELS[a]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Notes */}
          <Field label="Notas adicionales">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Observaciones, condiciones especiales..."
              className={cn(inputClass(false), "resize-none")}
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm",
                room.dot,
                "hover:opacity-90"
              )}
            >
              {existing ? "Guardar cambios" : "Agregar inquilino"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── PhoneInput ───────────────────────────────────────────────────────────────
function PhoneInput({
  value,
  country,
  onChange,
  onCountryChange,
}: {
  value: string
  country: string
  onChange: (v: string) => void
  onCountryChange: (c: string) => void
}) {
  const selected = PHONE_COUNTRIES.find((c) => c.code === country) ?? PHONE_COUNTRIES[0]
  return (
    <div className="flex gap-1.5">
      <div className="relative">
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="appearance-none h-full pl-2 pr-6 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          aria-label="País del teléfono"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.prefix}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9 \-]/g, ""))}
        placeholder={selected.code === "CL" ? "9 1234 5678" : "número"}
        className={cn(inputClass(false), "flex-1 min-w-0")}
      />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inputClass(hasError: boolean) {
  return cn(
    "w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input"
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
