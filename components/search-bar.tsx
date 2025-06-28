"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, CreditCard, FileText, X } from "lucide-react"
import { searchAll, getSearchSuggestions, type SearchResult } from "@/lib/utils"
import { mockData } from "@/lib/mock-data"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export function SearchBar() {
    const { user } = useAuth()
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const searchRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (query.length >= 2) {
            const searchResults = searchAll(query, mockData.customers, mockData.loans, mockData.loanApplications, user!)
            setResults(searchResults)
            setIsOpen(true)
            setSelectedIndex(-1)
        } else {
            setResults([])
            setIsOpen(false)
        }
    }, [query, user])

    useEffect(() => {
        if (isOpen) {
            const searchSuggestions = getSearchSuggestions(mockData.customers, mockData.loans, mockData.loanApplications, user!)
            setSuggestions(searchSuggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())))
        }
    }, [isOpen, query, user])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, -1))
        } else if (e.key === "Enter") {
            e.preventDefault()
            if (selectedIndex >= 0 && results[selectedIndex]) {
                handleResultClick(results[selectedIndex])
            }
        } else if (e.key === "Escape") {
            setIsOpen(false)
            setSelectedIndex(-1)
        }
    }

    const handleResultClick = (result: SearchResult) => {
        router.push(result.url)
        setIsOpen(false)
        setQuery("")
        setSelectedIndex(-1)
    }

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion)
        setIsOpen(false)
    }

    const getResultIcon = (type: SearchResult["type"]) => {
        switch (type) {
            case "customer":
                return <Users className="w-4 h-4" />
            case "loan":
                return <CreditCard className="w-4 h-4" />
            case "application":
                return <FileText className="w-4 h-4" />
            default:
                return <Search className="w-4 h-4" />
        }
    }

    const getResultBadge = (type: SearchResult["type"]) => {
        const colors = {
            customer: "bg-blue-100 text-blue-800",
            loan: "bg-green-100 text-green-800",
            application: "bg-purple-100 text-purple-800"
        }
        return <Badge className={colors[type]}>{type}</Badge>
    }

    return (
        <div className="relative max-w-2xl mx-auto" ref={searchRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    type="text"
                    placeholder="Search customers, loans, applications..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    className="pl-10 pr-10"
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => {
                            setQuery("")
                            setIsOpen(false)
                        }}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
                    <CardContent className="p-0">
                        {results.length > 0 ? (
                            <div className="divide-y">
                                {results.map((result, index) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${index === selectedIndex ? "bg-gray-50 dark:bg-gray-800" : ""
                                            }`}
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-500">
                                                {getResultIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium truncate">{result.title}</p>
                                                    {getResultBadge(result.type)}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {result.subtitle}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {result.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="p-4 text-center text-gray-500">
                                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="p-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Suggestions
                                </p>
                                <div className="space-y-1">
                                    {suggestions.slice(0, 5).map((suggestion, index) => (
                                        <div
                                            key={suggestion}
                                            className={`p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${index === selectedIndex ? "bg-gray-50 dark:bg-gray-800" : ""
                                                }`}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            <p className="text-sm">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            )}
        </div>
    )
} 