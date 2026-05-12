import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
} from "docx"
import { saveAs } from "file-saver"
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

// Navy color for header cells (hex without #)
const HEADER_COLOR = "1a2b5e"
const HEADER_TEXT  = "FFFFFF"
const STRIPE_COLOR = "EEF2FF"
const VACANT_COLOR = "DCFCE7"

function headerCell(text: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: HEADER_COLOR, color: HEADER_COLOR },
    borders: cellBorders(),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, color: HEADER_TEXT, bold: true, size: 18 }),
        ],
      }),
    ],
  })
}

function dataCell(text: string, shade?: string): TableCell {
  return new TableCell({
    shading: shade
      ? { type: ShadingType.CLEAR, fill: shade, color: shade }
      : undefined,
    borders: cellBorders(),
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "—", size: 18 })],
      }),
    ],
  })
}

function cellBorders() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" }
  return { top: b, bottom: b, left: b, right: b }
}

function labelCell(label: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
    borders: cellBorders(),
    children: [
      new Paragraph({
        children: [new TextRun({ text: label, bold: true, size: 18 })],
      }),
    ],
  })
}

export async function exportTenantsWord(
  tenants: Tenant[],
  monthLabel: string
): Promise<void> {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // ── Summary table ─────────────────────────────────────────────────────────
  const occupied = ROOM_NUMBERS.filter((n) =>
    tenants.some(
      (t) =>
        t.roomNumber === n &&
        (!t.checkOutDate || t.checkOutDate >= todayStr)
    )
  ).length

  const summaryRows = [
    ["Total de piezas", "11"],
    ["Piezas ocupadas", String(occupied)],
    ["Piezas disponibles", String(11 - occupied)],
    ["Mes del reporte", monthLabel],
    [
      "Generado el",
      today.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ],
  ]

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: summaryRows.map(
      ([label, value]) =>
        new TableRow({
          children: [labelCell(label), dataCell(value)],
        })
    ),
  })

  // ── Per-room section ──────────────────────────────────────────────────────
  const roomSections: (Paragraph | Table)[] = []

  ROOM_NUMBERS.forEach((roomNum, idx) => {
    const active = tenants.find(
      (t) =>
        t.roomNumber === roomNum &&
        (!t.checkOutDate || t.checkOutDate >= todayStr)
    )

    // Room heading
    roomSections.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: idx === 0 ? 200 : 400, after: 120 },
        children: [
          new TextRun({
            text: `Pieza ${roomNum} — ${active ? active.name : "Disponible"}`,
            bold: true,
            size: 26,
          }),
        ],
      })
    )

    if (!active) {
      roomSections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  shading: { type: ShadingType.CLEAR, fill: VACANT_COLOR, color: VACANT_COLOR },
                  borders: cellBorders(),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: "Pieza disponible — sin arrendatario activo",
                          italics: true,
                          color: "166534",
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      )
      return
    }

    const stripe = idx % 2 === 0 ? STRIPE_COLOR : "FFFFFF"
    const fields: [string, string][] = [
      ["Nombre completo", active.name],
      ["RUT", active.rut || "—"],
      ["Nacionalidad", active.nationality],
      ["Estado civil", MARITAL_LABELS[active.maritalStatus ?? ""] || "—"],
      ["Trabajo / Ocupación", active.occupation || "—"],
      ["Teléfono", buildPhone(active.phoneCountry, active.phone)],
      ["Contacto emergencia", active.emergencyContactName || "—"],
      ["Tel. emergencia", buildPhone(active.emergencyPhoneCountry, active.emergencyPhone)],
      ["Fecha de llegada", formatDateCL(active.checkInDate)],
      ["Fecha de salida", active.checkOutDate ? formatDateCL(active.checkOutDate) : "Indefinido"],
      ["Tipo de estadía", STAY_LABELS[active.stayType] || "—"],
      ["Día de pago", String(getPaymentDay(active))],
      ["Arriendo mensual", `$${active.rentAmount.toLocaleString("es-CL")}`],
      [
        "Servicios incluidos",
        active.amenities.map((a) => AMENITY_LABELS[a] ?? a).join(", ") || "Ninguno",
      ],
    ]

    roomSections.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: fields.map(
          ([label, value]) =>
            new TableRow({
              children: [labelCell(label), dataCell(value, stripe)],
            })
        ),
      })
    )
  })

  // ── Build document ────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Residencial El Molino",
                bold: true,
                size: 36,
                color: HEADER_COLOR,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `Reporte de habitaciones — ${monthLabel}`,
                size: 22,
                color: "555555",
              }),
            ],
          }),

          // Summary
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 160 },
            children: [new TextRun({ text: "Resumen general", bold: true, size: 26 })],
          }),
          summaryTable,

          // Per-room
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 500, after: 160 },
            children: [new TextRun({ text: "Detalle por pieza", bold: true, size: 26 })],
          }),
          ...roomSections,
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const dateStr = today.toISOString().slice(0, 10)
  saveAs(blob, `Residencial_El_Molino_${dateStr}.docx`)
}
