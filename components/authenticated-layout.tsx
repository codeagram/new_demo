"use client"

import { Sidebar } from "@/components/sidebar"
import { SearchBar } from "@/components/search-bar"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 lg:ml-0">
                <div className="min-h-full">
                    {/* Search Bar */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                        <SearchBar />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    )
} 