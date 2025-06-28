"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockData } from "@/lib/mock-data"
import { Users, FileText, CreditCard, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3, PieChart, Activity, Target } from "lucide-react"
import { formatCurrency, filterLoansByUser, filterCustomersByUser, filterLoanApplicationsByUser } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function Dashboard() {
  const { user } = useAuth()

  // Filter data based on user access
  const accessibleCustomers = filterCustomersByUser(mockData.customers, user!)
  const accessibleApplications = filterLoanApplicationsByUser(mockData.loanApplications, mockData.customers, user!)
  const accessibleLoans = filterLoansByUser(mockData.loans, mockData.customers, user!)

  const stats = {
    totalCustomers: accessibleCustomers.length,
    totalApplications: accessibleApplications.length,
    activeLoans: accessibleLoans.filter((loan) => loan.status === "Active").length,
    totalDisbursed: accessibleLoans.reduce((sum, loan) => sum + loan.amount, 0),
    pendingApplications: accessibleApplications.filter(app => ["Draft", "Submitted", "Under Review"].includes(app.status)).length,
    overdueLoans: accessibleLoans.filter(loan => {
      const repayments = mockData.repayments.filter(r => r.loanId === loan.id && r.status === "Overdue")
      return repayments.length > 0
    }).length,
    totalCollected: mockData.repayments
      .filter(r => r.status === "Paid" && accessibleLoans.some(loan => loan.id === r.loanId))
      .reduce((sum, r) => sum + r.paidAmount, 0),
    kycPending: accessibleCustomers.filter(c => c.kycStatus === "Pending").length,
  }

  // Calculate collection efficiency
  const collectionEfficiency = stats.totalDisbursed > 0
    ? (stats.totalCollected / stats.totalDisbursed) * 100
    : 0

  // Get recent activities
  const recentApplications = accessibleApplications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const overduePayments = mockData.repayments
    .filter((r) => r.status === "Overdue" && accessibleLoans.some(loan => loan.id === r.loanId))
    .slice(0, 5)

  // Enhanced analytics
  const monthlyDisbursements = accessibleLoans.reduce((acc, loan) => {
    const month = new Date(loan.disbursementDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + loan.amount
    return acc
  }, {} as Record<string, number>)

  const productDistribution = accessibleApplications.reduce((acc, app) => {
    acc[app.product] = (acc[app.product] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const loanStatusDistribution = accessibleLoans.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate risk metrics
  const overdueAmount = accessibleLoans.reduce((sum, loan) => {
    const overdueRepayments = mockData.repayments.filter(r => r.loanId === loan.id && r.status === "Overdue")
    return sum + overdueRepayments.reduce((sum, r) => sum + r.expectedAmount, 0)
  }, 0)

  const portfolioAtRisk = stats.totalDisbursed > 0 ? (overdueAmount / stats.totalDisbursed) * 100 : 0

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your loan management system
          {user?.role === "staff" && user.partnerId && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Partner Access
            </span>
          )}
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.kycPending} pending KYC
            </p>
            <Progress value={(stats.totalCustomers - stats.kycPending) / stats.totalCustomers * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} pending review
            </p>
            <Progress value={(stats.totalApplications - stats.pendingApplications) / stats.totalApplications * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueLoans} overdue
            </p>
            <Progress value={(stats.activeLoans - stats.overdueLoans) / stats.activeLoans * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDisbursed)}</div>
            <p className="text-xs text-muted-foreground">
              {collectionEfficiency.toFixed(1)}% collection efficiency
            </p>
            <Progress value={collectionEfficiency} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{portfolioAtRisk.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overdueAmount)} overdue amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{collectionEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalCollected)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loan Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.activeLoans > 0 ? stats.totalDisbursed / stats.activeLoans : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLoans} active loans
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Applications
            </CardTitle>
            <CardDescription>Latest loan applications submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map((app) => {
                const customer = accessibleCustomers.find((c) => c.id === app.customerId)
                return (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{customer?.name || "Unknown Customer"}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(app.amount)} • {app.product}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${app.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : app.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {app.status}
                    </span>
                  </div>
                )
              })}
              {recentApplications.length === 0 && (
                <p className="text-center text-gray-500 py-4">No recent applications</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Overdue Payments
            </CardTitle>
            <CardDescription>Payments that are past due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overduePayments.map((repayment) => {
                const loan = accessibleLoans.find((l) => l.id === repayment.loanId)
                const customer = accessibleCustomers.find((c) => c.id === loan?.customerId)
                return (
                  <div key={repayment.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium">{customer?.name || "Unknown Customer"}</p>
                      <p className="text-sm text-gray-500">Due: {repayment.dueDate} • {repayment.overdueDays} days overdue</p>
                    </div>
                    <span className="text-red-600 font-medium">{formatCurrency(repayment.expectedAmount)}</span>
                  </div>
                )
              })}
              {overduePayments.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">No overdue payments</p>
                  <p className="text-sm text-gray-500">All payments are up to date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Product Distribution
            </CardTitle>
            <CardDescription>Applications by loan product type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(productDistribution).map(([product, count]) => (
                <div key={product} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{product}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalApplications) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Loan Status Distribution
            </CardTitle>
            <CardDescription>Current loan portfolio status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(loanStatusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status === 'Active' ? 'bg-green-600' :
                          status === 'Closed' ? 'bg-gray-600' :
                            status === 'Defaulted' ? 'bg-red-600' :
                              'bg-yellow-600'
                          }`}
                        style={{ width: `${(count / accessibleLoans.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/applications" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FileText className="w-6 h-6 mb-2 text-blue-600" />
              <p className="font-medium">New Application</p>
              <p className="text-sm text-gray-500">Create loan application</p>
            </a>
            <a href="/customers" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Users className="w-6 h-6 mb-2 text-green-600" />
              <p className="font-medium">Add Customer</p>
              <p className="text-sm text-gray-500">Register new customer</p>
            </a>
            <a href="/collection" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <DollarSign className="w-6 h-6 mb-2 text-purple-600" />
              <p className="font-medium">Collection</p>
              <p className="text-sm text-gray-500">Manage collections</p>
            </a>
            <a href="/reports" className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <BarChart3 className="w-6 h-6 mb-2 text-orange-600" />
              <p className="font-medium">Reports</p>
              <p className="text-sm text-gray-500">View analytics</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
