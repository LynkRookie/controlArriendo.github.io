"use client"

import { CalendarDays, LayoutGrid, Settings, Building2, Menu, X, BarChart2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type AppPage = "calendar" | "rooms" | "admin" | "finance"

interface AppNavProps {
  current: AppPage
  onChange: (page: AppPage) => void
}

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ElementType; description: string }[] = [
  { id: "calendar", label: "Calendario",     icon: CalendarDays, description: "Pagos y vencimientos" },
  { id: "rooms",    label: "Habitaciones",   icon: LayoutGrid,   description: "Estado de piezas" },
  { id: "admin",    label: "Administración", icon: Settings,     description: "Gestión de inquilinos" },
  { id: "finance",  label: "Finanzas",       icon: BarChart2,    description: "Ingresos y gastos" },
]

export default function AppNav({ current, onChange }: AppNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentItem = NAV_ITEMS.find((n) => n.id === current)!

  return (
    <>
      {/* ── Desktop top navbar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hidden md:flex items-center justify-between px-6 h-16 bg-primary shadow-lg shadow-primary/20">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-[0.15em]">Residencial</p>
            <p className="text-sm font-bold text-white tracking-tight">El Molino</p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center bg-white/10 rounded-xl p-1 gap-0.5" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={current === id ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                current === id
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Right spacer = symmetry with brand */}
        <div className="w-40" />
      </header>

      {/* ── Mobile top bar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex md:hidden items-center justify-between px-4 h-14 bg-primary shadow-md">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-white" />
          <span className="text-sm font-bold text-white">El Molino</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{currentItem.label}</span>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg bg-white/10 text-white"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-card shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-white" />
                <span className="font-bold text-white text-sm">Residencial El Molino</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
                aria-label="Cerrar menú"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex flex-col gap-1 p-4" aria-label="Menú móvil">
              {NAV_ITEMS.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => { onChange(id); setMobileOpen(false) }}
                  aria-current={current === id ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    current === id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Icon size={18} className={current === id ? "text-white" : "text-muted-foreground"} />
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className={cn("text-xs", current === id ? "text-white/70" : "text-muted-foreground")}>
                      {description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
