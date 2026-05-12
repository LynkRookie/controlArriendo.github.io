import * as XLSX from "xlsx"
import { Tenant } from "./types"
import { AMENITY_LABELS } from "./types"
import { ROOM_NUMBERS } from "./constants"
import { formatDateCL, getPaymentDay } from "./date-utils"

const MARITAL_LABELS: Record<string, string> = {
  soltero: "Soltero/a",
  casado: "Casado/a",
  pareja: "Con pareja",
  divorciado: "Divorciado/a",
  viudo: "Viudo/a",
  otro: "Otro",
}

const STAY_LABELS: Record<string, string> = {
  indefinido: "Indefinido",
  meses: "Por meses",
  dias: "Por días/noches",
}

const PHONE_PREFIX: Record<string, string> = {
  CL: "+56", VE: "+58", PE: "+51", CO: "+57", BO: "+591",
  AR: "+54", ES: "+34", US: "+1", GB: "+44", BR: "+55", MX: "+52",
}

function buildPhone(country: string | undefined, number: string | undefined): string {
  if (!number) return "—"
  const prefix = PHONE_PREFIX[country ?? "CL"] ?? ""
  return `${prefix} ${number}`.trim()
}

export function exportTenantsExcel(tenants: Tenant[]): void {
  const today = new Date()

  // Build rows — one per room (occupied or vacant)
  const rows: Record<string, string | number>[] = []

  ROOM_NUMBERS.forEach((roomNum) => {
    // Find active tenant for this room
    const active = tenants.find((t) => {
      if (t.roomNumber !== roomNum) return false
      if (!t.checkOutDate) return true
      return t.checkOutDate >= today.toISOString().slice(0, 10)
    })

    if (active) {
      rows.push({
        "Pieza":                   active.roomNumber,
        "Estado":                  "Ocupada",
        "Nombre completo":         active.name,
        "RUT":                     active.rut || "—",
        "Nacionalidad":            active.nationality,
        "Estado civil":            MARITAL_LABELS[active.maritalStatus ?? ""] || "—",
        "Trabajo / Ocupación":     active.occupation || "—",
        "Teléfono":                buildPhone(active.phoneCountry, active.phone),
        "Contacto emergencia":     active.emergencyContactName || "—",
        "Tel. emergencia":         buildPhone(active.emergencyPhoneCountry, active.emergencyPhone),
        "Fecha de llegada":        formatDateCL(active.checkInDate),
        "Fecha de salida":         active.checkOutDate ? formatDateCL(active.checkOutDate) : "Indefinido",
        "Tipo de estadía":         STAY_LABELS[active.stayType] || "—",
        "Día de pago":             getPaymentDay(active),
        "Arriendo mensual ($)":    active.rentAmount,
        "Servicios incluidos":     active.amenities
          .map((a) => AMENITY_LABELS[a] ?? a)
          .join(", ") || "Ninguno",
      })
    } else {
      rows.push({
        "Pieza":                   roomNum,
        "Estado":                  "Disponible",
        "Nombre completo":         "—",
        "RUT":                     "—",
        "Nacionalidad":            "—",
        "Estado civil":            "—",
        "Trabajo / Ocupación":     "—",
        "Teléfono":                "—",
        "Contacto emergencia":     "—",
        "Tel. emergencia":         "—",
        "Fecha de llegada":        "—",
        "Fecha de salida":         "—",
        "Tipo de estadía":         "—",
        "Día de pago":             "—",
        "Arriendo mensual ($)":    "—",
        "Servicios incluidos":     "—",
      })
    }
  })

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws["!cols"] = [
    { wch: 7 },   // Pieza
    { wch: 12 },  // Estado
    { wch: 28 },  // Nombre
    { wch: 14 },  // RUT
    { wch: 16 },  // Nacionalidad
    { wch: 14 },  // Estado civil
    { wch: 22 },  // Trabajo
    { wch: 16 },  // Teléfono
    { wch: 22 },  // Contacto
    { wch: 16 },  // Tel. emerg
    { wch: 16 },  // Llegada
    { wch: 16 },  // Salida
    { wch: 16 },  // Estadía
    { wch: 12 },  // Día pago
    { wch: 18 },  // Arriendo
    { wch: 42 },  // Servicios
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Residentes")

  // Summary sheet
  const occupied = rows.filter((r) => r["Estado"] === "Ocupada").length
  const summaryRows = [
    { "Descripción": "Total de piezas",       "Valor": 11 },
    { "Descripción": "Piezas ocupadas",        "Valor": occupied },
    { "Descripción": "Piezas disponibles",     "Valor": 11 - occupied },
    { "Descripción": "% Ocupación",            "Valor": `${Math.round((occupied / 11) * 100)}%` },
    {
      "Descripción": "Fecha de generación",
      "Valor": today.toLocaleDateString("es-CL", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary["!cols"] = [{ wch: 26 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen")

  // Download
  const dateStr = today.toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Residencial_El_Molino_${dateStr}.xlsx`)
}
