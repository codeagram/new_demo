"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { mockData } from "@/lib/mock-data"
import { useAuth } from "@/components/auth-provider"
import { filterLoansByUser, filterCustomersByUser, formatCurrency } from "@/lib/utils"
import {
    Shield,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Activity,
    Target,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    DollarSign,
    Users,
    FileText
} from "lucide-react"

export default function RiskManagement() {
    const { user } = useAuth()

    // Filter data based on user access
    const accessibleCustomers = filterCustomersByUser(mockData.customers, user!)
    const accessibleLoans = filterLoansByUser(mockData.loans, mockData.customers, user!)

    // Calculate risk metrics
    const totalPortfolio = accessibleLoans.reduce((sum, loan) => sum + loan.amount, 0)
    const overdueLoans = accessibleLoans.filter(loan => {
        const repayments = mockData.repayments.filter(r => r.loanId === loan.id && r.status === "Overdue")
        return repayments.length > 0
    })

    const overdueAmount = overdueLoans.reduce((sum, loan) => {
        const overdueRepayments = mockData.repayments.filter(r => r.loanId === loan.id && r.status === "Overdue")
        return sum + overdueRepayments.reduce((sum, r) => sum + r.expectedAmount, 0)
    }, 0)

    const defaultedLoans = accessibleLoans.filter(loan => loan.status === "Defaulted")
    const defaultedAmount = defaultedLoans.reduce((sum, loan) => sum + loan.amount, 0)

    // Risk ratios
    const portfolioAtRisk = totalPortfolio > 0 ? (overdueAmount / totalPortfolio) * 100 : 0
    const defaultRate = totalPortfolio > 0 ? (defaultedAmount / totalPortfolio) * 100 : 0
    const totalRiskExposure = portfolioAtRisk + defaultRate

    // Risk categories
    const lowRiskLoans = accessibleLoans.filter(loan => loan.amount <= 5000)
    const mediumRiskLoans = accessibleLoans.filter(loan => loan.amount > 5000 && loan.amount <= 20000)
    const highRiskLoans = accessibleLoans.filter(loan => loan.amount > 20000)

    // Customer risk analysis
    const customerRiskScores = accessibleCustomers.map(customer => {
        const customerLoans = accessibleLoans.filter(loan => loan.customerId === customer.id)
        const totalBorrowed = customerLoans.reduce((sum, loan) => sum + loan.amount, 0)
        const overdueCustomerLoans = customerLoans.filter(loan => {
            const repayments = mockData.repayments.filter(r => r.loanId === loan.id && r.status === "Overdue")
            return repayments.length > 0
        })

        let riskScore = 0
        if (totalBorrowed > 50000) riskScore += 30
        if (overdueCustomerLoans.length > 0) riskScore += 40
        if (customerLoans.length > 3) riskScore += 20
        if (customer.kycStatus === "Pending") riskScore += 10

        return {
            customer,
            riskScore: Math.min(riskScore, 100),
            totalBorrowed,
            loanCount: customerLoans.length,
            overdueCount: overdueCustomerLoans.length
        }
    }).sort((a, b) => b.riskScore - a.riskScore)

    // Recent risk events
    const recentRiskEvents = [
        {
            id: 1,
            type: "Overdue Payment",
            description: "Payment overdue for 15 days",
            customer: "John Smith",
            amount: 2500,
            severity: "Medium",
            date: "2024-01-15"
        },
        {
            id: 2,
            type: "KYC Expired",
            description: "Customer KYC documents expired",
            customer: "Sarah Johnson",
            severity: "Low",
            date: "2024-01-14"
        },
        {
            id: 3,
            type: "High Risk Loan",
            description: "New loan approved above risk threshold",
            customer: "Mike Wilson",
            amount: 35000,
            severity: "High",
            date: "2024-01-13"
        }
    ]

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Risk Management</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Monitor and manage portfolio risk exposure
                </p>
            </div>

            {/* Risk Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Portfolio at Risk</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{portfolioAtRisk.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(overdueAmount)} overdue
                        </p>
                        <Progress value={portfolioAtRisk} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{defaultRate.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(defaultedAmount)} defaulted
                        </p>
                        <Progress value={defaultRate} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Risk Exposure</CardTitle>
                        <Shield className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{totalRiskExposure.toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">
                            Combined risk metrics
                        </p>
                        <Progress value={totalRiskExposure} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPortfolio)}</div>
                        <p className="text-xs text-muted-foreground">
                            {accessibleLoans.length} active loans
                        </p>
                        <Progress value={100} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Risk Distribution by Loan Size
                        </CardTitle>
                        <CardDescription>Portfolio breakdown by risk categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium">Low Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(lowRiskLoans.length / accessibleLoans.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">{lowRiskLoans.length}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span className="text-sm font-medium">Medium Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-yellow-500 h-2 rounded-full"
                                            style={{ width: `${(mediumRiskLoans.length / accessibleLoans.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">{mediumRiskLoans.length}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium">High Risk</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${(highRiskLoans.length / accessibleLoans.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">{highRiskLoans.length}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Recent Risk Events
                        </CardTitle>
                        <CardDescription>Latest risk alerts and events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentRiskEvents.map((event) => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div>
                                        <p className="font-medium">{event.type}</p>
                                        <p className="text-sm text-gray-500">{event.description}</p>
                                        <p className="text-xs text-gray-400">{event.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.amount && (
                                            <span className="text-sm font-medium">{formatCurrency(event.amount)}</span>
                                        )}
                                        <Badge
                                            variant={
                                                event.severity === "High" ? "destructive" :
                                                    event.severity === "Medium" ? "secondary" : "default"
                                            }
                                        >
                                            {event.severity}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* High Risk Customers */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        High Risk Customers
                    </CardTitle>
                    <CardDescription>Customers with elevated risk scores requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                                    <th className="text-left py-3 px-4 font-medium">Risk Score</th>
                                    <th className="text-left py-3 px-4 font-medium">Total Borrowed</th>
                                    <th className="text-left py-3 px-4 font-medium">Loans</th>
                                    <th className="text-left py-3 px-4 font-medium">Overdue</th>
                                    <th className="text-left py-3 px-4 font-medium">KYC Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerRiskScores.slice(0, 10).map((item) => (
                                    <tr key={item.customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{item.customer.name}</p>
                                                <p className="text-sm text-gray-500">{item.customer.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${item.riskScore >= 70 ? 'bg-red-500' :
                                                            item.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${item.riskScore}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium">{item.riskScore}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">{formatCurrency(item.totalBorrowed)}</td>
                                        <td className="py-3 px-4 text-sm">{item.loanCount}</td>
                                        <td className="py-3 px-4 text-sm">{item.overdueCount}</td>
                                        <td className="py-3 px-4">
                                            <Badge
                                                variant={item.customer.kycStatus === "Verified" ? "default" : "secondary"}
                                            >
                                                {item.customer.kycStatus}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Monitor
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Management Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Management Actions</CardTitle>
                    <CardDescription>Quick actions for risk mitigation</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button className="h-auto p-4 flex flex-col items-center gap-2">
                            <Shield className="w-6 h-6" />
                            <div>
                                <p className="font-medium">Risk Assessment</p>
                                <p className="text-sm text-gray-500">Evaluate new applications</p>
                            </div>
                        </Button>
                        <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
                            <AlertTriangle className="w-6 h-6" />
                            <div>
                                <p className="font-medium">Risk Alerts</p>
                                <p className="text-sm text-gray-500">Configure alerts</p>
                            </div>
                        </Button>
                        <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
                            <BarChart3 className="w-6 h-6" />
                            <div>
                                <p className="font-medium">Risk Reports</p>
                                <p className="text-sm text-gray-500">Generate reports</p>
                            </div>
                        </Button>
                        <Button className="h-auto p-4 flex flex-col items-center gap-2" variant="outline">
                            <Target className="w-6 h-6" />
                            <div>
                                <p className="font-medium">Risk Policies</p>
                                <p className="text-sm text-gray-500">Manage policies</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 