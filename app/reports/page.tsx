"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockData } from "@/lib/mock-data"
import {
    generatePortfolioReport,
    generateCollectionReport,
    generateFinancialReport,
    generateCustomerReport,
    generateApplicationReport,
    formatCurrency,
    formatPercentage,
    filterLoansByUser,
    filterLoanApplicationsByUser,
    getPartnerName,
} from "@/lib/utils"
import type { ReportFilter } from "@/lib/types"
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    FileText,
    Download,
    Filter,
    Calendar,
    Building,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function ReportsPage() {
    const { user } = useAuth()
    const [reportFilter, setReportFilter] = useState<ReportFilter>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    })

    // Get available partners for filter (admin sees all, staff sees only their partner)
    const availablePartners = user?.role === "admin"
        ? mockData.partners
        : mockData.partners.filter(p => p.id === user?.partnerId)

    // Filter data based on user access
    const accessibleLoans = filterLoansByUser(mockData.loans, mockData.customers, user!)
    const accessibleApplications = filterLoanApplicationsByUser(mockData.loanApplications, mockData.customers, user!)

    // Generate reports
    const portfolioReport = generatePortfolioReport(
        accessibleLoans,
        mockData.repayments,
        mockData.customers,
        reportFilter
    )

    const collectionReport = generateCollectionReport(
        mockData.collectionSchedules,
        mockData.repayments,
        reportFilter
    )

    const financialReport = generateFinancialReport(
        mockData.vouchers,
        mockData.journals,
        reportFilter
    )

    const customerReport = generateCustomerReport(
        mockData.customers,
        accessibleLoans,
        mockData.partners,
        reportFilter
    )

    const applicationReport = generateApplicationReport(
        accessibleApplications,
        mockData.customers,
        reportFilter
    )

    const handleExportReport = (reportType: string) => {
        // In a real application, this would generate and download a CSV/PDF
        console.log(`Exporting ${reportType} report with filter:`, reportFilter)
        alert(`${reportType} report export functionality would be implemented here`)
    }

    const getStatusBadge = (status: string) => {
        const colors = {
            Active: "bg-green-100 text-green-800",
            Closed: "bg-gray-100 text-gray-800",
            Defaulted: "bg-red-100 text-red-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-green-100 text-green-800",
            Rejected: "bg-red-100 text-red-800",
        }
        return <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{status}</Badge>
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400">Comprehensive reporting and analytics dashboard</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportReport("All")}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Report Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Report Filters
                    </CardTitle>
                    <CardDescription>Filter reports by date range and partner</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={reportFilter.startDate}
                                onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={reportFilter.endDate}
                                onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })}
                            />
                        </div>
                        {user?.role === "admin" && (
                            <div>
                                <Label htmlFor="partnerFilter">Partner</Label>
                                <Select
                                    value={reportFilter.partnerId?.toString() || "all"}
                                    onValueChange={(value) => setReportFilter({
                                        ...reportFilter,
                                        partnerId: value === "all" ? undefined : parseInt(value)
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Partners" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Partners</SelectItem>
                                        {availablePartners.map((partner) => (
                                            <SelectItem key={partner.id} value={partner.id.toString()}>
                                                {partner.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => setReportFilter({
                                    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0],
                                })}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                This Month
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reports Tabs */}
            <Tabs defaultValue="portfolio" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="portfolio" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="collection" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Collection
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Financial
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Customers
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Applications
                    </TabsTrigger>
                </TabsList>

                {/* Portfolio Report */}
                <TabsContent value="portfolio">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Portfolio Report</CardTitle>
                                    <CardDescription>Loan portfolio performance and metrics</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handleExportReport("Portfolio")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Loans</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{portfolioReport.totalLoans}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Loans</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{portfolioReport.activeLoans}</p>
                                </div>
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total Disbursed</p>
                                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(portfolioReport.totalDisbursed)}</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Outstanding</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(portfolioReport.totalOutstanding)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Portfolio Metrics</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Average Loan Size:</span>
                                            <span className="font-medium">{formatCurrency(portfolioReport.averageLoanSize)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Average Interest Rate:</span>
                                            <span className="font-medium">{formatPercentage(portfolioReport.averageInterestRate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Collection Efficiency:</span>
                                            <span className="font-medium">{formatPercentage(portfolioReport.collectionEfficiency)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Overdue Amount:</span>
                                            <span className="font-medium text-red-600">{formatCurrency(portfolioReport.overdueAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Loan Status Distribution</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Active Loans:</span>
                                            <span className="font-medium">{portfolioReport.activeLoans}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Closed Loans:</span>
                                            <span className="font-medium">{portfolioReport.closedLoans}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Defaulted Loans:</span>
                                            <span className="font-medium text-red-600">{portfolioReport.defaultedLoans}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Overdue Loans:</span>
                                            <span className="font-medium text-orange-600">{portfolioReport.overdueLoans}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Collection Report */}
                <TabsContent value="collection">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Collection Report</CardTitle>
                                    <CardDescription>Collection performance and agent metrics</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handleExportReport("Collection")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Due</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(collectionReport.totalDue)}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Collected</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(collectionReport.collectedAmount)}</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Overdue</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(collectionReport.overdueAmount)}</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Efficiency</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatPercentage(collectionReport.collectionEfficiency)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Upcoming Collections</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Due Today:</span>
                                            <span className="font-medium">{collectionReport.dueToday}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Due This Week:</span>
                                            <span className="font-medium">{collectionReport.dueThisWeek}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Due This Month:</span>
                                            <span className="font-medium">{collectionReport.dueThisMonth}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Collection Summary</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Overdue Loans:</span>
                                            <span className="font-medium text-red-600">{collectionReport.overdueLoans}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Collection Agents:</span>
                                            <span className="font-medium">{collectionReport.agentPerformance.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {collectionReport.agentPerformance.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Agent Performance</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Agent</TableHead>
                                                <TableHead>Assigned</TableHead>
                                                <TableHead>Collected</TableHead>
                                                <TableHead>Overdue</TableHead>
                                                <TableHead>Efficiency</TableHead>
                                                <TableHead>Total Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {collectionReport.agentPerformance.map((agent) => (
                                                <TableRow key={agent.agentName}>
                                                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                                                    <TableCell>{agent.totalAssigned}</TableCell>
                                                    <TableCell className="text-green-600">{agent.collected}</TableCell>
                                                    <TableCell className="text-red-600">{agent.overdue}</TableCell>
                                                    <TableCell>{formatPercentage(agent.efficiency)}</TableCell>
                                                    <TableCell>{formatCurrency(agent.totalAmount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Report */}
                <TabsContent value="financial">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Financial Report</CardTitle>
                                    <CardDescription>Financial performance and revenue analysis</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handleExportReport("Financial")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Receipts</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(financialReport.totalReceipts)}</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Payments</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(financialReport.totalPayments)}</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Net Balance</p>
                                    <p className={`text-2xl font-bold ${financialReport.netBalance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        {formatCurrency(financialReport.netBalance)}
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Interest Earned</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(financialReport.interestEarned)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Revenue Breakdown</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Interest Earned:</span>
                                            <span className="font-medium">{formatCurrency(financialReport.interestEarned)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Fees Collected:</span>
                                            <span className="font-medium">{formatCurrency(financialReport.feesCollected)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Penalties Collected:</span>
                                            <span className="font-medium">{formatCurrency(financialReport.penaltiesCollected)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Monthly Breakdown</h3>
                                    <div className="max-h-48 overflow-y-auto">
                                        {financialReport.monthlyBreakdown.map((month) => (
                                            <div key={month.month} className="flex justify-between py-1 border-b">
                                                <span className="text-sm">{new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                                <span className="text-sm font-medium">{formatCurrency(month.netAmount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Customer Report */}
                <TabsContent value="customers">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Customer Report</CardTitle>
                                    <CardDescription>Customer demographics and KYC status</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handleExportReport("Customer")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Customers</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{customerReport.totalCustomers}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">New Customers</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{customerReport.newCustomers}</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active Customers</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{customerReport.activeCustomers}</p>
                                </div>
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">KYC Pending</p>
                                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{customerReport.kycPending}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-3">KYC Status</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Verified:</span>
                                            <span className="font-medium text-green-600">{customerReport.kycVerified}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pending:</span>
                                            <span className="font-medium text-orange-600">{customerReport.kycPending}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Rejected:</span>
                                            <span className="font-medium text-red-600">{customerReport.kycRejected}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Customer Metrics</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>New (Last 30 days):</span>
                                            <span className="font-medium">{customerReport.newCustomers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Active Customers:</span>
                                            <span className="font-medium">{customerReport.activeCustomers}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {customerReport.customerByPartner.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Customers by Partner</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Partner</TableHead>
                                                <TableHead>Total Customers</TableHead>
                                                <TableHead>Active Loans</TableHead>
                                                <TableHead>Total Disbursed</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customerReport.customerByPartner.map((partner) => (
                                                <TableRow key={partner.partnerName}>
                                                    <TableCell className="font-medium">{partner.partnerName}</TableCell>
                                                    <TableCell>{partner.totalCustomers}</TableCell>
                                                    <TableCell>{partner.activeLoans}</TableCell>
                                                    <TableCell>{formatCurrency(partner.totalDisbursed)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Application Report */}
                <TabsContent value="applications">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Application Report</CardTitle>
                                    <CardDescription>Loan application processing and approval metrics</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handleExportReport("Application")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Applications</p>
                                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{applicationReport.totalApplications}</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Approved</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{applicationReport.approvedApplications}</p>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Rejected</p>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{applicationReport.rejectedApplications}</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Approval Rate</p>
                                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatPercentage(applicationReport.approvalRate)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-3">Application Status</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Pending:</span>
                                            <span className="font-medium text-orange-600">{applicationReport.pendingApplications}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Average Processing Time:</span>
                                            <span className="font-medium">{applicationReport.averageProcessingTime.toFixed(1)} days</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-3">Processing Metrics</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Approval Rate:</span>
                                            <span className="font-medium">{formatPercentage(applicationReport.approvalRate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Processing Time:</span>
                                            <span className="font-medium">{applicationReport.averageProcessingTime.toFixed(1)} days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {applicationReport.applicationsByProduct.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3">Applications by Product</h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Approved</TableHead>
                                                <TableHead>Rejected</TableHead>
                                                <TableHead>Pending</TableHead>
                                                <TableHead>Approval Rate</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {applicationReport.applicationsByProduct.map((product) => (
                                                <TableRow key={product.product}>
                                                    <TableCell className="font-medium">{product.product}</TableCell>
                                                    <TableCell>{product.total}</TableCell>
                                                    <TableCell className="text-green-600">{product.approved}</TableCell>
                                                    <TableCell className="text-red-600">{product.rejected}</TableCell>
                                                    <TableCell className="text-orange-600">{product.pending}</TableCell>
                                                    <TableCell>{formatPercentage(product.approvalRate)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
} 