import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ServerWrapper } from "@/components/server-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Loan Management System",
  description: "Complete LMS MVP Demo",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ServerWrapper>
          {children}
        </ServerWrapper>
      </body>
    </html>
  )
}
