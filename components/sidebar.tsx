"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FileText, CreditCard, Settings, XCircle, BookOpen, Home, LogOut, DollarSign, Menu, X, BarChart3, Building, Package, Bell, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { generateNotifications, getNotificationCount, getCriticalNotificationCount } from "@/lib/utils"
import { mockData } from "@/lib/mock-data"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Applications", href: "/applications", icon: FileText },
  { name: "Loans", href: "/loans", icon: CreditCard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Collection", href: "/collection", icon: DollarSign },
  { name: "Accounting", href: "/accounting", icon: BookOpen },
  { name: "Servicing", href: "/servicing", icon: Settings },
  { name: "Closure", href: "/closure", icon: XCircle },
  { name: "Risk Management", href: "/risk-management", icon: AlertTriangle },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Partners", href: "/partners", icon: Building },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Generate notifications
  const notifications = generateNotifications(
    mockData.loans,
    mockData.customers,
    mockData.loanApplications,
    mockData.repayments,
    user!
  )
  const unreadCount = getNotificationCount(notifications)
  const criticalCount = getCriticalNotificationCount(notifications)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <div className={cn(
              "flex items-center space-x-3 flex-1",
              isCollapsed ? "justify-center" : ""
            )}>
              {!isCollapsed && (
                <>
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">LMS</h1>
                </>
              )}
            </div>

            {/* Notifications */}
            {!isCollapsed && (
              <div className="relative mr-2">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-medium flex items-center justify-center",
                    criticalCount > 0 ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {criticalCount > 0 ? criticalCount : unreadCount}
                  </span>
                )}
              </div>
            )}

            {/* Desktop Toggle Button */}
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            {/* Toggle Button for collapsed state */}
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="absolute top-2 left-1/2 transform -translate-x-1/2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400",
                      isCollapsed ? "mx-auto" : "mr-3"
                    )} />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className={cn(
              "flex items-center gap-3 mb-3",
              isCollapsed ? "justify-center" : ""
            )}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{user?.name?.charAt(0)}</span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut className={cn(
                "w-4 h-4 flex-shrink-0",
                isCollapsed ? "" : "mr-2"
              )} />
              {!isCollapsed && "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
