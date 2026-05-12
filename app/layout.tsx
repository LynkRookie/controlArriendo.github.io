import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Residencial El Molino",
  description: "Sistema de gestión de habitaciones — Residencial El Molino",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a2b5e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
