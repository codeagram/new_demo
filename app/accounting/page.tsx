"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockData, getNextId } from "@/lib/mock-data"
import type { Voucher, Journal, Transaction } from "@/lib/types"
import { Plus, Receipt, BookOpen, CreditCard, TrendingUp, TrendingDown } from "lucide-react"

export default function AccountingPage() {
  const [vouchers, setVouchers] = useState(mockData.vouchers)
  const [journals, setJournals] = useState(mockData.journals)
  const [transactions, setTransactions] = useState(mockData.transactions)
  const [isVoucherOpen, setIsVoucherOpen] = useState(false)
  const [isJournalOpen, setIsJournalOpen] = useState(false)

  const [voucherForm, setVoucherForm] = useState({
    type: "",
    amount: "",
    note: "",
    customerId: "",
    loanId: "",
    referenceId: "",
    category: "",
  })

  const [journalForm, setJournalForm] = useState({
    entry: "",
    loanId: "",
    amount: "",
    type: "",
    referenceId: "",
    category: "",
  })

  const handleCreateVoucher = () => {
    const newVoucher: Voucher = {
      id: getNextId(vouchers),
      type: voucherForm.type as "Receipt" | "Payment",
      amount: Number.parseFloat(voucherForm.amount),
      note: voucherForm.note,
      customerId: voucherForm.customerId ? Number.parseInt(voucherForm.customerId) : undefined,
      loanId: voucherForm.loanId ? Number.parseInt(voucherForm.loanId) : undefined,
      date: new Date().toISOString(),
      referenceId: voucherForm.referenceId,
      category: voucherForm.category,
    }

    const updatedVouchers = [...vouchers, newVoucher]
    setVouchers(updatedVouchers)
    mockData.vouchers = updatedVouchers

    // Create corresponding transaction
    const newTransaction: Transaction = {
      id: getNextId(transactions),
      customerId: newVoucher.customerId || 0,
      loanId: newVoucher.loanId,
      description: newVoucher.note,
      amount: newVoucher.amount,
      type: newVoucher.type === "Receipt" ? "Credit" : "Debit",
      date: newVoucher.date,
    }

    const updatedTransactions = [...transactions, newTransaction]
    setTransactions(updatedTransactions)
    mockData.transactions = updatedTransactions

    setVoucherForm({ type: "", amount: "", note: "", customerId: "", loanId: "", referenceId: "", category: "" })
    setIsVoucherOpen(false)
  }

  const handleCreateJournal = () => {
    const newJournal: Journal = {
      id: getNextId(journals),
      entry: journalForm.entry,
      loanId: Number.parseInt(journalForm.loanId),
      amount: Number.parseFloat(journalForm.amount),
      type: journalForm.type as "Debit" | "Credit",
      date: new Date().toISOString(),
      referenceId: journalForm.referenceId,
      category: journalForm.category,
    }

    const updatedJournals = [...journals, newJournal]
    setJournals(updatedJournals)
    mockData.journals = updatedJournals

    setJournalForm({ entry: "", loanId: "", amount: "", type: "", referenceId: "", category: "" })
    setIsJournalOpen(false)
  }

  const totalReceipts = vouchers.filter((v) => v.type === "Receipt").reduce((sum, v) => sum + v.amount, 0)
  const totalPayments = vouchers.filter((v) => v.type === "Payment").reduce((sum, v) => sum + v.amount, 0)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
          <p className="text-gray-600">Financial records and transaction management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Receipt className="w-4 h-4 mr-2" />
                New Voucher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Voucher</DialogTitle>
                <DialogDescription>Record a new receipt or payment voucher.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={voucherForm.type}
                    onValueChange={(value) => setVoucherForm({ ...voucherForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receipt">Receipt</SelectItem>
                      <SelectItem value="Payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Note</Label>
                  <Input
                    id="note"
                    value={voucherForm.note}
                    onChange={(e) => setVoucherForm({ ...voucherForm, note: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Customer (Optional)</Label>
                  <Select
                    value={voucherForm.customerId}
                    onValueChange={(value) => setVoucherForm({ ...voucherForm, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockData.customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Loan (Optional)</Label>
                  <Select
                    value={voucherForm.loanId}
                    onValueChange={(value) => setVoucherForm({ ...voucherForm, loanId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockData.loans.map((loan) => {
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
                  <Label htmlFor="referenceId">Reference ID</Label>
                  <Input
                    id="referenceId"
                    value={voucherForm.referenceId}
                    onChange={(e) => setVoucherForm({ ...voucherForm, referenceId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={voucherForm.category}
                    onChange={(e) => setVoucherForm({ ...voucherForm, category: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateVoucher}>Create Voucher</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
                <DialogDescription>Record a manual journal entry.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="entry">Entry Description</Label>
                  <Input
                    id="entry"
                    value={journalForm.entry}
                    onChange={(e) => setJournalForm({ ...journalForm, entry: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Loan</Label>
                  <Select
                    value={journalForm.loanId}
                    onValueChange={(value) => setJournalForm({ ...journalForm, loanId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockData.loans.map((loan) => {
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
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={journalForm.amount}
                    onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={journalForm.type}
                    onValueChange={(value) => setJournalForm({ ...journalForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Debit">Debit</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="referenceId">Reference ID</Label>
                  <Input
                    id="referenceId"
                    value={journalForm.referenceId}
                    onChange={(e) => setJournalForm({ ...journalForm, referenceId: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={journalForm.category}
                    onChange={(e) => setJournalForm({ ...journalForm, category: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateJournal}>Create Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalReceipts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalReceipts - totalPayments >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ₹{(totalReceipts - totalPayments).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journals.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Tabs */}
      <Tabs defaultValue="vouchers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <CardTitle>Vouchers</CardTitle>
              <CardDescription>Receipt and payment vouchers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vouchers.map((voucher) => {
                  const customer = voucher.customerId
                    ? mockData.customers.find((c) => c.id === voucher.customerId)
                    : null
                  const loan = voucher.loanId ? mockData.loans.find((l) => l.id === voucher.loanId) : null

                  return (
                    <div key={voucher.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{voucher.note}</p>
                            <p className="text-sm text-gray-500">
                              {customer?.name} {loan && `• Loan #${loan.id}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{new Date(voucher.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`font-medium ${voucher.type === "Receipt" ? "text-green-600" : "text-red-600"}`}
                          >
                            {voucher.type === "Receipt" ? "+" : "-"}₹{voucher.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            voucher.type === "Receipt" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {voucher.type}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journals">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>Manual and automatic journal entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journals.map((journal) => {
                  const loan = mockData.loans.find((l) => l.id === journal.loanId)
                  const customer = mockData.customers.find((c) => c.id === loan?.customerId)

                  return (
                    <div key={journal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{journal.entry}</p>
                            <p className="text-sm text-gray-500">
                              {customer?.name} • Loan #{loan?.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{new Date(journal.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${journal.type === "Credit" ? "text-green-600" : "text-red-600"}`}>
                            ₹{journal.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            journal.type === "Credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {journal.type}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>All financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const customer = mockData.customers.find((c) => c.id === transaction.customerId)
                  const loan = transaction.loanId ? mockData.loans.find((l) => l.id === transaction.loanId) : null

                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {customer?.name} {loan && `• Loan #${loan.id}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{new Date(transaction.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`font-medium ${transaction.type === "Credit" ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.type === "Credit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            transaction.type === "Credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>Customer Ledger</CardTitle>
              <CardDescription>Customer-wise financial summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockData.customers.map((customer) => {
                  const customerTransactions = transactions.filter((t) => t.customerId === customer.id)
                  const totalCredits = customerTransactions
                    .filter((t) => t.type === "Credit")
                    .reduce((sum, t) => sum + t.amount, 0)
                  const totalDebits = customerTransactions
                    .filter((t) => t.type === "Debit")
                    .reduce((sum, t) => sum + t.amount, 0)
                  const balance = totalCredits - totalDebits

                  return (
                    <div key={customer.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium">{customer.name}</h3>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Balance</p>
                          <p className={`font-medium ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹{balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Credits</p>
                          <p className="font-medium text-green-600">₹{totalCredits.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Debits</p>
                          <p className="font-medium text-red-600">₹{totalDebits.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Transactions</p>
                          <p className="font-medium">{customerTransactions.length}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
