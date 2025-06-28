"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import type { LoanClosure } from "@/lib/types"
import { XCircle, CheckCircle, FileText } from "lucide-react"

export default function ClosurePage() {
  const [closures, setClosures] = useState(mockData.loanClosures)
  const [loans, setLoans] = useState(mockData.loans)
  const [isRequestOpen, setIsRequestOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null)
  const [closureForm, setClosureForm] = useState({
    remarks: "",
    closedBy: "",
  })

  const handleClosureRequest = () => {
    if (selectedLoanId) {
      const loan = loans.find((l) => l.id === selectedLoanId)
      if (loan) {
        // Calculate settlement amount (remaining principal + interest)
        const paidRepayments = mockData.repayments.filter((r) => r.loanId === selectedLoanId && r.status === "Paid")
        const totalPaidPrincipal = paidRepayments.reduce((sum, r) => sum + r.principalAmount, 0)
        const outstanding = loan.amount - totalPaidPrincipal

        const newClosure: LoanClosure = {
          id: getNextId(closures),
          loanId: selectedLoanId,
          closureDate: null,
          status: "Pending",
          settlementAmount: outstanding,
          requestDate: new Date().toISOString(),
          remarks: closureForm.remarks,
          closedBy: closureForm.closedBy,
        }

        const updatedClosures = [...closures, newClosure]
        setClosures(updatedClosures)
        mockData.loanClosures = updatedClosures

        setSelectedLoanId(null)
        setIsRequestOpen(false)
      }
    }
  }

  const handleClosureFinal = (closureId: number) => {
    const updatedClosures = closures.map((c) =>
      c.id === closureId ? { ...c, status: "Closed" as const, closureDate: new Date().toISOString() } : c,
    )
    setClosures(updatedClosures)
    mockData.loanClosures = updatedClosures

    // Update loan status to Closed
    const closure = updatedClosures.find((c) => c.id === closureId)
    if (closure) {
      const updatedLoans = loans.map((l) => (l.id === closure.loanId ? { ...l, status: "Closed" as const } : l))
      setLoans(updatedLoans)
      mockData.loans = updatedLoans

      // Create final payment to make outstanding balance 0
      const loan = mockData.loans.find((l) => l.id === closure.loanId)
      if (loan) {
        // Calculate current outstanding balance
        const paidRepayments = mockData.repayments.filter((r) => r.loanId === loan.id && r.status === "Paid")
        const totalPaidPrincipal = paidRepayments.reduce((sum, r) => sum + r.principalAmount, 0)
        const outstanding = loan.amount - totalPaidPrincipal

        if (outstanding > 0) {
          // Create a voucher (receipt) for the final payment
          const newVoucher = {
            id: getNextId(mockData.vouchers),
            type: "Receipt" as const,
            amount: outstanding,
            note: "Final Settlement Payment - Loan Closure",
            customerId: loan.customerId,
            loanId: loan.id,
            date: new Date().toISOString(),
          }
          mockData.vouchers.push(newVoucher)

          // Create a repayment record for the final payment
          const newRepayment = {
            id: getNextId(mockData.repayments),
            loanId: loan.id,
            installmentNumber: mockData.repayments.filter(r => r.loanId === loan.id).length + 1,
            dueDate: new Date().toISOString().split('T')[0],
            paidDate: new Date().toISOString().split('T')[0],
            paidAmount: outstanding,
            expectedAmount: outstanding,
            principalAmount: outstanding,
            interestAmount: 0,
            paymentMode: "BankTransfer" as const,
            isAdvancePayment: false,
            status: "Paid" as const,
            overdueDays: 0,
          }
          mockData.repayments.push(newRepayment)

          // Create a transaction for the final payment
          const finalTransaction = {
            id: getNextId(mockData.transactions),
            customerId: loan.customerId,
            loanId: loan.id,
            description: "Final Settlement Payment - Loan Closure",
            amount: outstanding,
            type: "Credit" as const,
            date: new Date().toISOString(),
          }
          mockData.transactions.push(finalTransaction)

          // Create a journal entry for the final payment
          const finalJournal = {
            id: getNextId(mockData.journals),
            entry: "Final Principal Payment - Loan Closure",
            loanId: loan.id,
            amount: outstanding,
            type: "Debit" as const,
            date: new Date().toISOString(),
          }
          mockData.journals.push(finalJournal)

          // Calculate current ledger balance and create balancing transaction if needed
          const customerTransactions = mockData.transactions.filter((t) => t.customerId === loan.customerId)
          const totalCredits = customerTransactions
            .filter((t) => t.type === "Credit")
            .reduce((sum, t) => sum + t.amount, 0)
          const totalDebits = customerTransactions
            .filter((t) => t.type === "Debit")
            .reduce((sum, t) => sum + t.amount, 0)
          const currentBalance = totalCredits - totalDebits

          // If there's still a positive balance after the final payment, create a balancing debit
          if (currentBalance > 0) {
            const balancingTransaction = {
              id: getNextId(mockData.transactions),
              customerId: loan.customerId,
              loanId: loan.id,
              description: "Balance Settlement - Loan Closure",
              amount: currentBalance,
              type: "Debit" as const,
              date: new Date().toISOString(),
            }
            mockData.transactions.push(balancingTransaction)

            const balancingJournal = {
              id: getNextId(mockData.journals),
              entry: "Balance Settlement - Loan Closure",
              loanId: loan.id,
              amount: currentBalance,
              type: "Debit" as const,
              date: new Date().toISOString(),
            }
            mockData.journals.push(balancingJournal)
          }
        }
      }
    }
  }

  const getStatusBadge = (status: LoanClosure["status"]) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Closed: "bg-green-100 text-green-800",
    }

    return <Badge className={colors[status]}>{status}</Badge>
  }

  const eligibleLoans = loans.filter(
    (l) => l.status === "Active" && !closures.some((c) => c.loanId === l.id && c.status === "Pending"),
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Closure</h1>
          <p className="text-gray-600">Manage loan closure requests and settlements</p>
        </div>
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogTrigger asChild>
            <Button>
              <XCircle className="w-4 h-4 mr-2" />
              Request Closure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Loan Closure</DialogTitle>
              <DialogDescription>Select a loan to request closure and settlement.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Select Loan</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedLoanId || ""}
                  onChange={(e) => setSelectedLoanId(Number.parseInt(e.target.value))}
                >
                  <option value="">Select a loan</option>
                  {eligibleLoans.map((loan) => {
                    const customer = mockData.customers.find((c) => c.id === loan.customerId)
                    const paidRepayments = mockData.repayments.filter(
                      (r) => r.loanId === loan.id && r.status === "Paid",
                    )
                    const totalPaidPrincipal = paidRepayments.reduce((sum, r) => sum + r.principalAmount, 0)
                    const outstanding = loan.amount - totalPaidPrincipal

                    return (
                      <option key={loan.id} value={loan.id}>
                        Loan #{loan.id} - {customer?.name} (Outstanding: ₹{outstanding.toLocaleString()})
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  value={closureForm.remarks}
                  onChange={(e) => setClosureForm({ ...closureForm, remarks: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="closedBy">Closed By</label>
                <input
                  id="closedBy"
                  value={closureForm.closedBy}
                  onChange={(e) => setClosureForm({ ...closureForm, closedBy: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClosureRequest} disabled={!selectedLoanId}>
                Request Closure
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Closures</CardTitle>
            <XCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {closures.filter((c) => c.status === "Pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Loans</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {closures.filter((c) => c.status === "Closed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settlement</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {closures
                .filter((c) => c.status === "Closed")
                .reduce((sum, c) => sum + c.settlementAmount, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Closure Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Closure Requests</CardTitle>
          <CardDescription>Manage loan closure requests and settlements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {closures.map((closure) => {
              const loan = mockData.loans.find((l) => l.id === closure.loanId)
              const customer = mockData.customers.find((c) => c.id === loan?.customerId)

              return (
                <div key={closure.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="font-medium">{customer?.name}</p>
                        <p className="text-sm text-gray-500">
                          Loan #{loan?.id} • Requested: {new Date(closure.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Settlement Amount</p>
                        <p className="font-medium">₹{closure.settlementAmount.toLocaleString()}</p>
                      </div>
                      {closure.closureDate && (
                        <div>
                          <p className="text-sm text-gray-500">Closure Date</p>
                          <p className="font-medium">{new Date(closure.closureDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {closure.remarks && (
                        <div>
                          <p className="text-sm text-gray-500">Remarks: {closure.remarks}</p>
                        </div>
                      )}
                      {closure.closedBy && (
                        <div>
                          <p className="text-sm text-gray-500">Closed By: {closure.closedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(closure.status)}
                    {closure.status === "Pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleClosureFinal(closure.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Close Loan
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Loan Closure Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Closure Summary</CardTitle>
          <CardDescription>Overview of closed loans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {closures
              .filter((c) => c.status === "Closed")
              .map((closure) => {
                const loan = mockData.loans.find((l) => l.id === closure.loanId)
                const customer = mockData.customers.find((c) => c.id === loan?.customerId)

                return (
                  <div key={closure.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-green-800">{customer?.name}</p>
                        <p className="text-sm text-green-600">
                          Loan #{loan?.id} • Closed on{" "}
                          {closure.closureDate && new Date(closure.closureDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">Final Settlement</p>
                        <p className="font-medium text-green-800">₹{closure.settlementAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-green-600">Original Amount</p>
                        <p className="font-medium">₹{loan?.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Interest Rate</p>
                        <p className="font-medium">{loan?.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-green-600">Tenure</p>
                        <p className="font-medium">{loan?.tenureMonths} months</p>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
