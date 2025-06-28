"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockData, getNextId } from "@/lib/mock-data"
import type { Loan, Voucher, Repayment, Transaction, Journal } from "@/lib/types"
import {
  calculateEMI,
  calculateTotalInterest,
  calculateTotalAmount,
  generateAmortizationSchedule,
  calculatePrepaymentSavings,
  formatCurrency,
  formatPercentage,
  filterLoansByUser,
  getPartnerName,
  type AmortizationRow
} from "@/lib/utils"
import { Eye, Calendar, DollarSign, Calculator, FileText, Building, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

export default function LoansPage() {
  const { user } = useAuth()
  const [loans, setLoans] = useState(mockData.loans)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState<string>("all")
  const { toast } = useToast();

  // Filter loans based on user access
  const accessibleLoans = filterLoansByUser(loans, mockData.customers, user!)

  // Apply partner filter
  const filteredLoans = partnerFilter === "all"
    ? accessibleLoans
    : accessibleLoans.filter(loan => {
      const customer = mockData.customers.find(c => c.id === loan.customerId)
      return customer?.partnerId?.toString() === partnerFilter
    })

  // Get available partners for filter (admin sees all, staff sees only their partner)
  const availablePartners = user?.role === "admin"
    ? mockData.partners
    : mockData.partners.filter(p => p.id === user?.partnerId)

  // Calculator state
  const [calculatorData, setCalculatorData] = useState({
    principal: "",
    rate: "",
    tenure: "",
    disbursementDate: new Date().toISOString().split('T')[0]
  })

  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationRow[]>([])
  const [loanSchedule, setLoanSchedule] = useState<AmortizationRow[]>([])

  const getStatusBadge = (status: Loan["status"]) => {
    const colors = {
      Active: "bg-green-100 text-green-800",
      Closed: "bg-gray-100 text-gray-800",
      Defaulted: "bg-red-100 text-red-800",
      PreClosed: "bg-blue-100 text-blue-800",
    }

    return <Badge className={colors[status]}>{status}</Badge>
  }

  const calculateOutstanding = (loan: Loan) => {
    const paidRepayments = mockData.repayments.filter((r) => r.loanId === loan.id && r.status === "Paid")
    const totalPaid = paidRepayments.reduce((sum, r) => sum + r.principalAmount, 0)
    return loan.amount - totalPaid
  }

  const handleCalculateEMI = () => {
    const principal = parseFloat(calculatorData.principal)
    const rate = parseFloat(calculatorData.rate)
    const tenure = parseInt(calculatorData.tenure)

    if (!principal || !rate || !tenure) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid values for all fields",
        variant: "destructive"
      })
      return
    }

    const emi = calculateEMI(principal, rate, tenure)
    const totalInterest = calculateTotalInterest(principal, emi, tenure)
    const totalAmount = calculateTotalAmount(principal, emi, tenure)
    const schedule = generateAmortizationSchedule(principal, rate, tenure, calculatorData.disbursementDate)

    setAmortizationSchedule(schedule)

    toast({
      title: "EMI Calculated",
      description: `Monthly EMI: ${formatCurrency(emi)} | Total Interest: ${formatCurrency(totalInterest)} | Total Amount: ${formatCurrency(totalAmount)}`
    })
  }

  const handleViewSchedule = (loan: Loan) => {
    setSelectedLoan(loan)
    // Generate amortization schedule for the selected loan
    const schedule = generateAmortizationSchedule(
      loan.amount,
      loan.interestRate,
      loan.tenureMonths,
      loan.disbursementDate
    )
    setLoanSchedule(schedule)
    setIsScheduleOpen(true)
  }

  const handlePayEMI = (loan: Loan) => {
    // Calculate interest for this EMI (simple interest for demonstration)
    const annualInterestRate = loan.interestRate / 100;
    const monthlyInterestRate = annualInterestRate / 12;
    const outstanding = calculateOutstanding(loan);
    const interestAmount = Math.round(outstanding * monthlyInterestRate);
    const principalAmount = loan.emi - interestAmount;

    // Create a voucher (receipt)
    const newVoucher: Voucher = {
      id: getNextId(mockData.vouchers),
      type: "Receipt" as const,
      amount: loan.emi,
      note: "EMI Payment",
      customerId: loan.customerId,
      loanId: loan.id,
      date: new Date().toISOString(),
    };
    mockData.vouchers.push(newVoucher);

    // Create a repayment record
    const newRepayment: Repayment = {
      id: getNextId(mockData.repayments),
      loanId: loan.id,
      installmentNumber: mockData.repayments.filter(r => r.loanId === loan.id).length + 1,
      dueDate: new Date().toISOString().split('T')[0],
      paidDate: new Date().toISOString().split('T')[0],
      paidAmount: loan.emi,
      expectedAmount: loan.emi,
      principalAmount,
      interestAmount,
      paymentMode: "Cash" as const,
      isAdvancePayment: false,
      status: "Paid" as const,
      overdueDays: 0,
    };
    mockData.repayments.push(newRepayment);

    // Create a transaction for principal (Credit)
    const principalTransaction: Transaction = {
      id: getNextId(mockData.transactions),
      customerId: loan.customerId,
      loanId: loan.id,
      description: "EMI Principal Payment",
      amount: principalAmount,
      type: "Credit" as const,
      date: new Date().toISOString(),
    };
    mockData.transactions.push(principalTransaction);

    // Create a transaction for interest (Credit)
    const interestTransaction: Transaction = {
      id: getNextId(mockData.transactions),
      customerId: loan.customerId,
      loanId: loan.id,
      description: "Interest Accrued",
      amount: interestAmount,
      type: "Credit" as const,
      date: new Date().toISOString(),
    };
    mockData.transactions.push(interestTransaction);

    // Create a journal entry for interest accrued (Credit)
    const interestJournal: Journal = {
      id: getNextId(mockData.journals),
      entry: "Interest Accrued",
      loanId: loan.id,
      amount: interestAmount,
      type: "Credit" as const,
      date: new Date().toISOString(),
    };
    mockData.journals.push(interestJournal);

    // Create a journal entry for principal reduction (Debit)
    const principalJournal: Journal = {
      id: getNextId(mockData.journals),
      entry: "Principal Reduction",
      loanId: loan.id,
      amount: principalAmount,
      type: "Debit" as const,
      date: new Date().toISOString(),
    };
    mockData.journals.push(principalJournal);

    // Update the loans state to reflect changes
    setLoans([...mockData.loans]);

    toast({
      title: "EMI Payment Successful",
      description: `EMI receipt for ${formatCurrency(loan.emi)} has been created. Principal: ${formatCurrency(principalAmount)}, Interest: ${formatCurrency(interestAmount)}`
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage active and closed loans
            {user?.role === "staff" && user.partnerId && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Partner: {getPartnerName(user.partnerId, mockData.partners)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCalculatorOpen(true)}>
            <Calculator className="w-4 h-4 mr-2" />
            EMI Calculator
          </Button>
        </div>
      </div>

      {/* Partner Filter */}
      {user?.role === "admin" && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-medium">Filter by Partner:</Label>
            </div>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select partner" />
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
            <div className="text-sm text-gray-500">
              {filteredLoans.length} loans found
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredLoans.map((loan) => {
          const customer = mockData.customers.find((c) => c.id === loan.customerId)
          const application = mockData.loanApplications.find((a) => a.id === loan.applicationId)
          const outstanding = calculateOutstanding(loan)

          return (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Loan #{loan.id} - {customer?.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Disbursed: {new Date(loan.disbursementDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Amount: {formatCurrency(loan.amount)}
                      </span>
                      {customer?.partnerId && (
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {getPartnerName(customer.partnerId, mockData.partners)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(loan.status)}
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedLoan(loan)
                      setIsViewOpen(true)
                    }}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">EMI Amount</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(loan.emi)}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">per {loan.repaymentFrequency}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(outstanding)}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">remaining</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Interest Rate</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatPercentage(loan.interestRate)}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Annual rate</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Tenure</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{loan.tenureMonths}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">months</p>
                  </div>
                </div>

                {loan.status === "Active" && (
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => handlePayEMI(loan)}>
                      Pay EMI
                    </Button>
                    <Button variant="outline" onClick={() => handleViewSchedule(loan)}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Schedule
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* EMI Calculator Dialog */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">EMI Calculator</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">Calculate your monthly EMI and view the complete amortization schedule</p>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Loan Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="principal" className="text-xs font-medium text-gray-700 dark:text-gray-300">Loan Amount (₹)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={calculatorData.principal}
                    onChange={(e) => setCalculatorData({ ...calculatorData, principal: e.target.value })}
                    placeholder="Enter loan amount"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="rate" className="text-xs font-medium text-gray-700 dark:text-gray-300">Interest Rate (% p.a.)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={calculatorData.rate}
                    onChange={(e) => setCalculatorData({ ...calculatorData, rate: e.target.value })}
                    placeholder="Enter interest rate"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="tenure" className="text-xs font-medium text-gray-700 dark:text-gray-300">Tenure (Months)</Label>
                  <Input
                    id="tenure"
                    type="number"
                    value={calculatorData.tenure}
                    onChange={(e) => setCalculatorData({ ...calculatorData, tenure: e.target.value })}
                    placeholder="Enter tenure"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="disbursementDate" className="text-xs font-medium text-gray-700 dark:text-gray-300">Disbursement Date</Label>
                  <Input
                    id="disbursementDate"
                    type="date"
                    value={calculatorData.disbursementDate}
                    onChange={(e) => setCalculatorData({ ...calculatorData, disbursementDate: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleCalculateEMI} className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 text-sm">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate EMI
              </Button>
            </div>

            {amortizationSchedule.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Amortization Schedule</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complete breakdown of your loan payments</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">No.</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">Due Date</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">EMI</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">Principal</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">Interest</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-900 dark:text-white px-1">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amortizationSchedule.map((row, index) => (
                        <TableRow key={row.installmentNumber} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
                          <TableCell className="text-xs font-medium px-1">{row.installmentNumber}</TableCell>
                          <TableCell className="text-xs px-1">{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs font-medium text-green-600 dark:text-green-400 px-1">{formatCurrency(row.emi)}</TableCell>
                          <TableCell className="text-xs text-blue-600 dark:text-blue-400 px-1">{formatCurrency(row.principal)}</TableCell>
                          <TableCell className="text-xs text-orange-600 dark:text-orange-400 px-1">{formatCurrency(row.interest)}</TableCell>
                          <TableCell className="text-xs font-medium px-1">{formatCurrency(row.outstandingBalance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Summary Section */}
                  {amortizationSchedule.length > 0 && (
                    <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Principal</p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(amortizationSchedule.reduce((sum, row) => sum + row.principal, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Interest</p>
                          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(amortizationSchedule[amortizationSchedule.length - 1]?.cumulativeInterest || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(amortizationSchedule.reduce((sum, row) => sum + row.emi, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Amortization Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amortization Schedule - Loan #{selectedLoan?.id}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>EMI</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Cumulative Interest</TableHead>
                  <TableHead>Total Principal</TableHead>
                  <TableHead>Total Interest</TableHead>
                  <TableHead>Total Amount Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loanSchedule.map((row) => (
                  <TableRow key={row.installmentNumber}>
                    <TableCell>{row.installmentNumber}</TableCell>
                    <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(row.emi)}</TableCell>
                    <TableCell>{formatCurrency(row.principal)}</TableCell>
                    <TableCell>{formatCurrency(row.interest)}</TableCell>
                    <TableCell>{formatCurrency(row.outstandingBalance)}</TableCell>
                    <TableCell>{formatCurrency(row.cumulativeInterest)}</TableCell>
                    <TableCell>{formatCurrency(loanSchedule.slice(0, row.installmentNumber).reduce((sum, r) => sum + r.principal, 0))}</TableCell>
                    <TableCell>{formatCurrency(row.cumulativeInterest)}</TableCell>
                    <TableCell>{formatCurrency(row.installmentNumber * row.emi)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary Section */}
            {loanSchedule.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Loan Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Principal</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(loanSchedule.reduce((sum, row) => sum + row.principal, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Interest</p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(loanSchedule[loanSchedule.length - 1]?.cumulativeInterest || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(loanSchedule.reduce((sum, row) => sum + row.emi, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly EMI</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(loanSchedule[0]?.emi || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Loan Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Details</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="grid gap-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Loan ID</label>
                  <p className="text-sm">#{selectedLoan.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLoan.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <p className="text-sm">{mockData.customers.find((c) => c.id === selectedLoan.customerId)?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Principal Amount</label>
                  <p className="text-sm">{formatCurrency(selectedLoan.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Interest Rate</label>
                  <p className="text-sm">{formatPercentage(selectedLoan.interestRate)} per annum</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tenure</label>
                  <p className="text-sm">{selectedLoan.tenureMonths} months</p>
                </div>
                <div>
                  <label className="text-sm font-medium">EMI</label>
                  <p className="text-sm">{formatCurrency(selectedLoan.emi)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Outstanding</label>
                  <p className="text-sm">{formatCurrency(calculateOutstanding(selectedLoan))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Disbursement Date</label>
                  <p className="text-sm">{new Date(selectedLoan.disbursementDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Repayment Frequency</label>
                  <p className="text-sm">{selectedLoan.repaymentFrequency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Co-Applicants</label>
                  <p className="text-sm">
                    {selectedLoan.coApplicantIds.length > 0
                      ? selectedLoan.coApplicantIds.map(id => mockData.customers.find(c => c.id === id)?.name).filter(Boolean).join(", ")
                      : "None"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Guarantors</label>
                  <p className="text-sm">
                    {selectedLoan.guarantorIds.length > 0
                      ? selectedLoan.guarantorIds.map(id => mockData.customers.find(c => c.id === id)?.name).filter(Boolean).join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

