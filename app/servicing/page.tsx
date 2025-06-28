"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { mockData, getNextId } from "@/lib/mock-data"
import type { Loan, Repayment, CollectionSchedule, TopUp } from "@/lib/types"
import {
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

export default function ServicingPage() {
  const [loans, setLoans] = useState(mockData.loans)
  const [repayments, setRepayments] = useState(mockData.repayments)
  const [collectionSchedules, setCollectionSchedules] = useState(mockData.collectionSchedules)
  const [isTopupOpen, setIsTopupOpen] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [topupAmount, setTopupAmount] = useState("")
  const [topupApprovedDate, setTopupApprovedDate] = useState("")

  const [collectionForm, setCollectionForm] = useState({
    loanId: "",
    collectionAgent: "",
    priority: "Medium",
    remarks: "",
  })

  const handleTopupRequest = () => {
    if (!selectedLoanId || !topupAmount) return

    const newTopup: TopUp = {
      id: getNextId(mockData.topUps),
      loanId: selectedLoanId,
      requestedAmount: Number.parseFloat(topupAmount),
      tenureMonths: 6, // Default
      interestRate: 15, // Default
      status: "Requested",
      requestDate: new Date().toISOString(),
      approvedDate: topupApprovedDate || undefined,
    }

    mockData.topUps.push(newTopup)
    setTopupAmount("")
    setTopupApprovedDate("")
    setSelectedLoanId(null)
    setIsTopupOpen(false)
  }

  const handleCollectionAssignment = () => {
    if (!collectionForm.loanId || !collectionForm.collectionAgent) return

    const loanId = Number.parseInt(collectionForm.loanId)
    const updatedSchedules = collectionSchedules.map(schedule =>
      schedule.loanId === loanId
        ? {
          ...schedule,
          collectionAgent: collectionForm.collectionAgent,
          priority: collectionForm.priority as "Low" | "Medium" | "High" | "Critical"
        }
        : schedule
    )

    setCollectionSchedules(updatedSchedules)
    mockData.collectionSchedules = updatedSchedules

    setCollectionForm({ loanId: "", collectionAgent: "", priority: "Medium", remarks: "" })
    setIsCollectionOpen(false)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Upcoming: "bg-blue-100 text-blue-800",
      Due: "bg-yellow-100 text-yellow-800",
      Overdue: "bg-red-100 text-red-800",
      Paid: "bg-green-100 text-green-800",
      Partial: "bg-orange-100 text-orange-800",
    }
    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      Low: "bg-gray-100 text-gray-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Critical: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>
  }

  const calculateCollectionEfficiency = () => {
    const totalDue = collectionSchedules.filter(s => s.status === "Due" || s.status === "Overdue").length
    const totalPaid = collectionSchedules.filter(s => s.status === "Paid").length
    const total = collectionSchedules.length

    if (total === 0) return 0
    return Math.round((totalPaid / total) * 100)
  }

  const getOverdueLoans = () => {
    return loans.filter(loan => {
      const loanRepayments = repayments.filter(r => r.loanId === loan.id)
      return loanRepayments.some(r => r.status === "Overdue")
    })
  }

  const getDueToday = () => {
    const today = new Date().toISOString().split('T')[0]
    return collectionSchedules.filter(schedule => schedule.dueDate === today)
  }

  const getOverdueSchedules = () => {
    return collectionSchedules.filter(schedule => schedule.status === "Overdue")
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loan Servicing</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage loan collections and servicing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <User className="w-4 h-4 mr-2" />
                Assign Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Collection Agent</DialogTitle>
                <DialogDescription>Assign a collection agent to handle overdue payments.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Loan</Label>
                  <Select
                    value={collectionForm.loanId}
                    onValueChange={(value) => setCollectionForm({ ...collectionForm, loanId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {getOverdueLoans().map((loan) => {
                        const customer = mockData.customers.find((c) => c.id === loan.customerId)
                        return (
                          <SelectItem key={loan.id} value={loan.id.toString()}>
                            Loan #{loan.id} - {customer?.name}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Collection Agent</Label>
                  <Select
                    value={collectionForm.collectionAgent}
                    onValueChange={(value) => setCollectionForm({ ...collectionForm, collectionAgent: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agent 1">Agent 1</SelectItem>
                      <SelectItem value="Agent 2">Agent 2</SelectItem>
                      <SelectItem value="Agent 3">Agent 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={collectionForm.priority}
                    onValueChange={(value) => setCollectionForm({ ...collectionForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Remarks</Label>
                  <Input
                    value={collectionForm.remarks}
                    onChange={(e) => setCollectionForm({ ...collectionForm, remarks: e.target.value })}
                    placeholder="Add collection remarks"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCollectionAssignment}>Assign Agent</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Top-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Loan Top-up</DialogTitle>
                <DialogDescription>Request additional loan amount for existing customers.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Loan</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedLoanId || ""}
                    onChange={(e) => setSelectedLoanId(Number.parseInt(e.target.value))}
                  >
                    <option value="">Select a loan</option>
                    {mockData.loans
                      .filter((l) => l.status === "Active")
                      .map((loan) => {
                        const customer = mockData.customers.find((c) => c.id === loan.customerId)
                        return (
                          <option key={loan.id} value={loan.id}>
                            Loan #{loan.id} - {customer?.name}
                          </option>
                        )
                      })}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Top-up Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="approvedDate">Approved Date</Label>
                  <Input
                    id="approvedDate"
                    type="date"
                    value={topupApprovedDate}
                    onChange={(e) => setTopupApprovedDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleTopupRequest}>Request Top-up</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCollectionEfficiency()}%</div>
            <p className="text-xs text-muted-foreground">
              {collectionSchedules.filter(s => s.status === "Paid").length} of {collectionSchedules.length} collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getDueToday().length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(getDueToday().reduce((sum, s) => sum + s.emiAmount, 0))} total due
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getOverdueSchedules().length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(getOverdueSchedules().reduce((sum, s) => sum + s.emiAmount, 0))} overdue amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.filter(l => l.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(loans.filter(l => l.status === "Active").reduce((sum, l) => sum + l.amount, 0))} total portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Management Tabs */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Collection Schedule</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Management</TabsTrigger>
          <TabsTrigger value="repayments">Repayment History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Collection Schedule</CardTitle>
              <CardDescription>Upcoming and due payments</CardDescription>
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
                    <TableHead>Agent</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionSchedules.map((schedule) => {
                    const customer = mockData.customers.find((c) => c.id === schedule.customerId)
                    const loan = mockData.loans.find((l) => l.id === schedule.loanId)
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {customer?.name}
                          </div>
                        </TableCell>
                        <TableCell>#{schedule.loanId}</TableCell>
                        <TableCell>{new Date(schedule.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{formatCurrency(schedule.emiAmount)}</TableCell>
                        <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                        <TableCell>
                          {schedule.overdueDays > 0 ? (
                            <span className="text-red-600 font-medium">{schedule.overdueDays} days</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {schedule.collectionAgent ? (
                            <Badge variant="outline">{schedule.collectionAgent}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Management</CardTitle>
              <CardDescription>Loans with overdue payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Overdue Amount</TableHead>
                    <TableHead>Overdue Days</TableHead>
                    <TableHead>Collection Agent</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead>Next Reminder</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOverdueSchedules().map((schedule) => {
                    const customer = mockData.customers.find((c) => c.id === schedule.customerId)
                    const overdueRepayments = repayments.filter(
                      r => r.loanId === schedule.loanId && r.status === "Overdue"
                    )
                    const totalOverdue = overdueRepayments.reduce((sum, r) => sum + r.expectedAmount, 0)

                    return (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer?.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-3 h-3" />
                              {customer?.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>#{schedule.loanId}</TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(totalOverdue)}
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{schedule.overdueDays} days</span>
                        </TableCell>
                        <TableCell>
                          {schedule.collectionAgent ? (
                            <Badge variant="outline">{schedule.collectionAgent}</Badge>
                          ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {schedule.lastReminderDate ? (
                            new Date(schedule.lastReminderDate).toLocaleDateString()
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>
                          {schedule.nextReminderDate ? (
                            new Date(schedule.nextReminderDate).toLocaleDateString()
                          ) : (
                            "Not scheduled"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Phone className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MapPin className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments">
          <Card>
            <CardHeader>
              <CardTitle>Repayment History</CardTitle>
              <CardDescription>All loan repayments and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Overdue Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repayments.map((repayment) => {
                    const loan = mockData.loans.find((l) => l.id === repayment.loanId)
                    const customer = mockData.customers.find((c) => c.id === loan?.customerId)

                    return (
                      <TableRow key={repayment.id}>
                        <TableCell>#{repayment.loanId}</TableCell>
                        <TableCell>{customer?.name}</TableCell>
                        <TableCell>#{repayment.installmentNumber}</TableCell>
                        <TableCell>{new Date(repayment.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {repayment.paidDate ? (
                            new Date(repayment.paidDate).toLocaleDateString()
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(repayment.paidAmount)}</TableCell>
                        <TableCell>{formatCurrency(repayment.principalAmount)}</TableCell>
                        <TableCell>{formatCurrency(repayment.interestAmount)}</TableCell>
                        <TableCell>{getStatusBadge(repayment.status)}</TableCell>
                        <TableCell>
                          {repayment.overdueDays > 0 ? (
                            <span className="text-red-600 font-medium">{repayment.overdueDays} days</span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
