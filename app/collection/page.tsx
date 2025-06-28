"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { mockData, getNextId } from "@/lib/mock-data"
import type { CollectionSchedule, Repayment, Loan } from "@/lib/types"
import {
    Calendar,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    TrendingUp,
    Eye,
    Phone,
    Mail
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function CollectionPage() {
    const [collectionSchedules, setCollectionSchedules] = useState(mockData.collectionSchedules)
    const [repayments, setRepayments] = useState(mockData.repayments)
    const [loans, setLoans] = useState(mockData.loans)
    const [selectedSchedule, setSelectedSchedule] = useState<CollectionSchedule | null>(null)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterAgent, setFilterAgent] = useState<string>("all")

    // Calculate collection metrics
    const totalDue = collectionSchedules.reduce((sum, schedule) => sum + schedule.emiAmount, 0)
    const overdueAmount = collectionSchedules
        .filter(schedule => schedule.status === "Overdue")
        .reduce((sum, schedule) => sum + schedule.emiAmount, 0)
    const collectedAmount = collectionSchedules
        .filter(schedule => schedule.status === "Paid")
        .reduce((sum, schedule) => sum + schedule.emiAmount, 0)
    const collectionEfficiency = totalDue > 0 ? (collectedAmount / totalDue) * 100 : 0

    // Filter schedules based on status and agent
    const filteredSchedules = collectionSchedules.filter(schedule => {
        const statusMatch = filterStatus === "all" || schedule.status === filterStatus
        const agentMatch = filterAgent === "all" || schedule.collectionAgent === filterAgent
        return statusMatch && agentMatch
    })

    // Get unique collection agents
    const collectionAgents = Array.from(new Set(collectionSchedules.map(s => s.collectionAgent).filter((agent): agent is string => Boolean(agent))))

    const getStatusBadge = (status: CollectionSchedule["status"]) => {
        const colors = {
            Upcoming: "bg-blue-100 text-blue-800",
            Due: "bg-yellow-100 text-yellow-800",
            Overdue: "bg-red-100 text-red-800",
            Paid: "bg-green-100 text-green-800",
            Partial: "bg-orange-100 text-orange-800",
        }
        const icons = {
            Upcoming: Clock,
            Due: AlertTriangle,
            Overdue: AlertTriangle,
            Paid: CheckCircle,
            Partial: Clock,
        }
        const Icon = icons[status]
        return (
            <Badge className={colors[status]}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        )
    }

    const getPriorityBadge = (priority: CollectionSchedule["priority"]) => {
        const colors = {
            Low: "bg-gray-100 text-gray-800",
            Medium: "bg-yellow-100 text-yellow-800",
            High: "bg-orange-100 text-orange-800",
            Critical: "bg-red-100 text-red-800",
        }
        return <Badge className={colors[priority]}>{priority}</Badge>
    }

    const handleViewSchedule = (schedule: CollectionSchedule) => {
        setSelectedSchedule(schedule)
        setIsViewOpen(true)
    }

    const calculateOverdueDays = (dueDate: string) => {
        const due = new Date(dueDate)
        const today = new Date()
        const diffTime = today.getTime() - due.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    const getCustomerName = (customerId: number) => {
        return mockData.customers.find(c => c.id === customerId)?.name || "Unknown"
    }

    const getLoanDetails = (loanId: number) => {
        return mockData.loans.find(l => l.id === loanId)
    }

    const getCustomerPhone = (customerId: number) => {
        return mockData.customers.find(c => c.id === customerId)?.phone || "N/A"
    }

    const getCustomerEmail = (customerId: number) => {
        return mockData.customers.find(c => c.id === customerId)?.email || "N/A"
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Collection Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Track payments, manage overdue accounts, and monitor collection efficiency</p>
                </div>
            </div>

            {/* Collection Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Due</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDue)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Amount</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Collected Amount</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(collectedAmount)}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Collection Efficiency</p>
                                <p className="text-2xl font-bold text-purple-600">{collectionEfficiency.toFixed(1)}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <Label>Filter by Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Partial">Partial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <Label>Filter by Agent</Label>
                    <Select value={filterAgent} onValueChange={setFilterAgent}>
                        <SelectTrigger>
                            <SelectValue placeholder="All agents" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Agents</SelectItem>
                            {collectionAgents.map(agent => (
                                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Collection Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Collection Schedule</CardTitle>
                    <CardDescription>Track all upcoming and overdue payments</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Loan ID</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Overdue Days</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Agent</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSchedules.map((schedule) => {
                                const customerName = getCustomerName(schedule.customerId)
                                const loan = getLoanDetails(schedule.loanId)
                                const overdueDays = calculateOverdueDays(schedule.dueDate)

                                return (
                                    <TableRow key={schedule.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{customerName}</p>
                                                <p className="text-sm text-gray-500">{getCustomerPhone(schedule.customerId)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>#{schedule.loanId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(schedule.dueDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(schedule.emiAmount)}</TableCell>
                                        <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                                        <TableCell>
                                            {overdueDays > 0 ? (
                                                <span className="text-red-600 font-medium">{overdueDays} days</span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                                        <TableCell>{schedule.collectionAgent || "Unassigned"}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewSchedule(schedule)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Schedule Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Collection Details</DialogTitle>
                    </DialogHeader>
                    {selectedSchedule && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Customer</Label>
                                    <p className="text-sm font-medium">{getCustomerName(selectedSchedule.customerId)}</p>
                                </div>
                                <div>
                                    <Label>Loan ID</Label>
                                    <p className="text-sm font-medium">#{selectedSchedule.loanId}</p>
                                </div>
                                <div>
                                    <Label>Due Date</Label>
                                    <p className="text-sm font-medium">{new Date(selectedSchedule.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label>Amount</Label>
                                    <p className="text-sm font-medium">{formatCurrency(selectedSchedule.emiAmount)}</p>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedSchedule.status)}</div>
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <div className="mt-1">{getPriorityBadge(selectedSchedule.priority)}</div>
                                </div>
                                <div>
                                    <Label>Collection Agent</Label>
                                    <p className="text-sm font-medium">{selectedSchedule.collectionAgent || "Unassigned"}</p>
                                </div>
                                <div>
                                    <Label>Overdue Days</Label>
                                    <p className="text-sm font-medium">
                                        {calculateOverdueDays(selectedSchedule.dueDate)} days
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Customer Contact Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span className="text-sm">{getCustomerPhone(selectedSchedule.customerId)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-sm">{getCustomerEmail(selectedSchedule.customerId)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Loan Details</h4>
                                {(() => {
                                    const loan = getLoanDetails(selectedSchedule.loanId)
                                    if (!loan) return <p className="text-sm text-gray-500">Loan details not found</p>

                                    return (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Principal Amount</Label>
                                                <p className="text-sm font-medium">{formatCurrency(loan.amount)}</p>
                                            </div>
                                            <div>
                                                <Label>Interest Rate</Label>
                                                <p className="text-sm font-medium">{loan.interestRate}%</p>
                                            </div>
                                            <div>
                                                <Label>EMI</Label>
                                                <p className="text-sm font-medium">{formatCurrency(loan.emi)}</p>
                                            </div>
                                            <div>
                                                <Label>Tenure</Label>
                                                <p className="text-sm font-medium">{loan.tenureMonths} months</p>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
} 