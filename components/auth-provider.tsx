"use client"

import { useState, createContext, useContext } from "react"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import type { User } from "@/lib/types"
import { mockData } from "@/lib/mock-data"

// Authentication context
interface AuthContextType {
    user: User | null
    login: (email: string, password: string) => boolean
    logout: () => void
    isAuthenticated: boolean
    availableUsers: User[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    const login = (email: string, password: string): boolean => {
        // Demo login - accept any email with password "demo123"
        if (password === "demo123") {
            // Find user by email
            const foundUser = mockData.users.find(u => u.email === email)
            if (foundUser) {
                setUser(foundUser)
                return true
            }
            // If email not found, use admin as default
            setUser(mockData.users[0]) // Admin user
            return true
        }
        return false
    }

    const logout = () => {
        setUser(null)
    }

    const authValue: AuthContextType = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        availableUsers: mockData.users
    }

    return (
        <AuthContext.Provider value={authValue}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </AuthContext.Provider>
    )
} 