import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Risk Management - Loan Management System",
    description: "Monitor and manage portfolio risk exposure",
}

export default function RiskManagementLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
} 