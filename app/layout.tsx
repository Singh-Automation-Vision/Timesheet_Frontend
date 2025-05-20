import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import ClientWrapper from "@/components/ClientWrapper"
import { AuthProvider } from "@/lib/auth-context"
import { PerformanceProvider } from "@/lib/performance-context"

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
})

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
      <head>
        {/* Preload critical assets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Add preload hints for critical resources */}
        <link rel="preload" href="/api/users" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <PerformanceProvider>
          <AuthProvider>
            <ClientWrapper>{children}</ClientWrapper>
            <Toaster />
          </AuthProvider>
        </PerformanceProvider>
      </body>
    </html>
  )
}
