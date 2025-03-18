import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import ClientWrapper from "@/components/ClientWrapper"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Performance Tracker",
  description: "Track and manage employee performance",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <ClientWrapper>{children}</ClientWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'