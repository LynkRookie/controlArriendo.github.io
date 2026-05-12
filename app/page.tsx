"use client"

import { useState } from "react"
import AppNav, { AppPage } from "@/components/AppNav"
import CalendarPage from "@/components/CalendarPage"
import RoomsPage from "@/components/RoomsPage"
import AdminPage from "@/components/AdminPage"
import FinancePage from "@/components/FinancePage"

export default function Home() {
  const [page, setPage] = useState<AppPage>("calendar")

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav current={page} onChange={setPage} />
      <div className="flex-1">
        {page === "calendar" && <CalendarPage />}
        {page === "rooms" && <RoomsPage />}
        {page === "admin" && <AdminPage />}
        {page === "finance" && <FinancePage />}
      </div>
    </div>
  )
}
