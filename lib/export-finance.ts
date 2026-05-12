import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
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
} from "docx"
import {
  Tenant,
  PaymentRecord,
  Expense,
  EXPENSE_CATEGORY_LABELS,
} from "./types"
import { MONTHS_ES } from "./constants"

function clp(n: number): string {
  return "$" + n.toLocaleString("es-CL")
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export interface FinanceSummary {
  year: number
  month: number
  grossIncome: number       // sum of paid rents
  totalExpenses: number     // sum of expenses
  netProfit: number         // grossIncome - totalExpenses
  dailyAvg: number          // netProfit / days in month
  weeklyAvg: number         // netProfit / weeks in month
  paidTenants: Tenant[]
  unpaidTenants: Tenant[]
  expenses: Expense[]
}

export function buildFinanceSummary(
  year: number,
  month: number,
  tenants: Tenant[],
  payments: PaymentRecord[],
  expenses: Expense[]
): FinanceSummary {
  const activeTenants = tenants.filter((t) => {
    if (t.checkOutDate) {
      // include if they were still there at any point in the month
      const checkOut = t.checkOutDate
      const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
      if (checkOut < monthStart) return false
    }
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`
    if (t.checkInDate > monthEnd) return false
    return true
  })

  const monthExpenses = expenses.filter((e) => e.year === year && e.month === month)
  const monthPayments = payments.filter((p) => p.year === year && p.month === month && p.paidAt)

  const paidTenants = activeTenants.filter((t) =>
    monthPayments.some((p) => p.tenantId === t.id)
  )
  const unpaidTenants = activeTenants.filter(
    (t) => !monthPayments.some((p) => p.tenantId === t.id)
  )

  const grossIncome = paidTenants.reduce((sum, t) => {
    const rec = monthPayments.find((p) => p.tenantId === t.id)
    return sum + (rec?.amount ?? t.rentAmount)
  }, 0)

  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossIncome - totalExpenses
  const days = daysInMonth(year, month)
  const dailyAvg = days > 0 ? netProfit / days : 0
  const weeklyAvg = (netProfit / days) * 7

  return {
    year,
    month,
    grossIncome,
    totalExpenses,
    netProfit,
    dailyAvg,
    weeklyAvg,
    paidTenants,
    unpaidTenants,
    expenses: monthExpenses,
  }
}

export function exportFinanceExcel(summary: FinanceSummary): void {
  const monthName = MONTHS_ES[summary.month - 1]
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Resumen ────────────────────────────────────────────────
  const resumeData = [
    ["RESUMEN FINANCIERO — RESIDENCIAL EL MOLINO"],
    [`Período: ${monthName} ${summary.year}`],
    [`Generado: ${new Date().toLocaleDateString("es-CL")}`],
    [],
    ["CONCEPTO", "MONTO"],
    ["Ingresos brutos (arriendos cobrados)", clp(summary.grossIncome)],
    ["Total gastos del mes", clp(summary.totalExpenses)],
    ["Ganancia neta", clp(summary.netProfit)],
    ["Promedio diario", clp(Math.round(summary.dailyAvg))],
    ["Promedio semanal", clp(Math.round(summary.weeklyAvg))],
    [],
    [`Arrendatarios que pagaron: ${summary.paidTenants.length}`],
    [`Arrendatarios pendientes: ${summary.unpaidTenants.length}`],
  ]
  const wsResume = XLSX.utils.aoa_to_sheet(resumeData)
  wsResume["!cols"] = [{ wch: 42 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsResume, "Resumen")

  // ── Sheet 2: Ingresos por pieza ─────────────────────────────────────
  const incomeHeader = ["Pieza", "Arrendatario", "Estadía", "Monto Arriendo", "Estado mes"]
  const incomeRows = [incomeHeader]

  const allActive = [...summary.paidTenants, ...summary.unpaidTenants].sort(
    (a, b) => a.roomNumber - b.roomNumber
  )
  for (const t of allActive) {
    const paid = summary.paidTenants.includes(t)
    const stay =
      t.stayType === "indefinido" ? "Indefinido" :
      t.stayType === "meses" ? "Por meses" : "Por días"
    incomeRows.push([
      `Pieza ${t.roomNumber}`,
      t.name,
      stay,
      clp(t.rentAmount),
      paid ? "Pagado" : "Pendiente",
    ])
  }

  const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows)
  wsIncome["!cols"] = [{ wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsIncome, "Ingresos por pieza")

  // ── Sheet 3: Gastos ─────────────────────────────────────────────────
  const expHeader = ["Fecha", "Categoría", "Descripción", "Monto"]
  const expRows = [expHeader]
  for (const e of summary.expenses) {
    expRows.push([
      e.date,
      EXPENSE_CATEGORY_LABELS[e.category],
      e.description || "—",
      clp(e.amount),
    ])
  }
  expRows.push([], ["", "", "TOTAL GASTOS", clp(summary.totalExpenses)])

  const wsExp = XLSX.utils.aoa_to_sheet(expRows)
  wsExp["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsExp, "Gastos")

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `finanzas-${monthName.toLowerCase()}-${summary.year}.xlsx`
  )
}

// ── Word export ────────────────────────────────────────────────────────────────

const BORDER_NONE = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
}

const BORDER_THIN = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
}

function cell(text: string, bold = false, shade?: string): TableCell {
  return new TableCell({
    borders: BORDER_THIN,
    shading: shade ? { fill: shade } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      }),
    ],
  })
}

export async function exportFinanceWord(summary: FinanceSummary): Promise<void> {
  const monthName = MONTHS_ES[summary.month - 1]
  const allActive = [...summary.paidTenants, ...summary.unpaidTenants].sort(
    (a, b) => a.roomNumber - b.roomNumber
  )

  const stayLabel = (t: Tenant) =>
    t.stayType === "indefinido" ? "Indefinido" :
    t.stayType === "meses" ? "Por meses" : "Por días"

  // ── Income table rows ───────────────────────────────────────────────
  const incomeRows = [
    new TableRow({
      children: [
        cell("Pieza", true, "1E3A5E"),
        cell("Arrendatario", true, "1E3A5E"),
        cell("Estadía", true, "1E3A5E"),
        cell("Monto", true, "1E3A5E"),
        cell("Estado", true, "1E3A5E"),
      ],
      tableHeader: true,
    }),
    ...allActive.map((t, i) => {
      const paid = summary.paidTenants.includes(t)
      const shade = i % 2 === 0 ? "F5F7FA" : "FFFFFF"
      return new TableRow({
        children: [
          cell(`Pieza ${t.roomNumber}`, false, shade),
          cell(t.name, false, shade),
          cell(stayLabel(t), false, shade),
          cell(clp(t.rentAmount), false, shade),
          cell(paid ? "Pagado" : "Pendiente", false, shade),
        ],
      })
    }),
    new TableRow({
      children: [
        cell("", false, "E8F5E9"),
        cell("", false, "E8F5E9"),
        cell("", false, "E8F5E9"),
        cell("TOTAL INGRESOS", true, "E8F5E9"),
        cell(clp(summary.grossIncome), true, "E8F5E9"),
      ],
    }),
  ]

  // ── Expense table rows ──────────────────────────────────────────────
  const expenseRows = [
    new TableRow({
      children: [
        cell("Fecha", true, "1E3A5E"),
        cell("Categoría", true, "1E3A5E"),
        cell("Descripción", true, "1E3A5E"),
        cell("Monto", true, "1E3A5E"),
      ],
      tableHeader: true,
    }),
    ...summary.expenses.map((e, i) => {
      const shade = i % 2 === 0 ? "FFF5F5" : "FFFFFF"
      return new TableRow({
        children: [
          cell(e.date, false, shade),
          cell(EXPENSE_CATEGORY_LABELS[e.category], false, shade),
          cell(e.description || "—", false, shade),
          cell(clp(e.amount), false, shade),
        ],
      })
    }),
    new TableRow({
      children: [
        cell("", false, "FFEBEE"),
        cell("", false, "FFEBEE"),
        cell("TOTAL GASTOS", true, "FFEBEE"),
        cell(clp(summary.totalExpenses), true, "FFEBEE"),
      ],
    }),
  ]

  const doc = new Document({
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "RESIDENCIAL EL MOLINO",
                bold: true,
                size: 36,
                color: "1E3A5E",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Informe Financiero — ${monthName} ${summary.year}`,
                size: 26,
                color: "555555",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generado el ${new Date().toLocaleDateString("es-CL")}`,
                size: 20,
                color: "888888",
                italics: true,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          // Summary box
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Resumen del mes", bold: true, size: 28, color: "1E3A5E" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [cell("Ingresos brutos", true, "E8F5E9"), cell(clp(summary.grossIncome), false, "E8F5E9")] }),
              new TableRow({ children: [cell("Total gastos", true, "FFEBEE"), cell(clp(summary.totalExpenses), false, "FFEBEE")] }),
              new TableRow({ children: [cell("Ganancia neta", true, summary.netProfit >= 0 ? "C8E6C9" : "FFCDD2"), cell(clp(summary.netProfit), true, summary.netProfit >= 0 ? "C8E6C9" : "FFCDD2")] }),
              new TableRow({ children: [cell("Promedio diario", false, "F5F7FA"), cell(clp(Math.round(summary.dailyAvg)), false, "F5F7FA")] }),
              new TableRow({ children: [cell("Promedio semanal", false, "F5F7FA"), cell(clp(Math.round(summary.weeklyAvg)), false, "F5F7FA")] }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          // Income section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Ingresos por pieza", bold: true, size: 28, color: "1E3A5E" })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: incomeRows,
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),

          // Expenses section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Gastos del mes", bold: true, size: 28, color: "1E3A5E" })],
          }),
          summary.expenses.length === 0
            ? new Paragraph({ children: [new TextRun({ text: "Sin gastos registrados en este mes.", italics: true, color: "888888" })] })
            : new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: expenseRows,
              }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `finanzas-${monthName.toLowerCase()}-${summary.year}.docx`)
}
