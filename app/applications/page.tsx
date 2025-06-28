"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { mockData, getNextId } from "@/lib/mock-data"
import type { LoanApplication, Loan } from "@/lib/types"
import { Plus, Eye, CheckCircle, XCircle, Building, Filter, Calculator, Users, Shield, Upload, AlertCircle, X } from "lucide-react"
import { filterLoanApplicationsByUser, getPartnerName, formatCurrency, getActiveProducts, getProductById, validateLoanAmount, validateLoanTenure, checkCustomerEligibility, calculateEMI, calculateTotalInterest, calculateTotalAmount } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"

export default function ApplicationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState(mockData.loanApplications)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState<string>("all")

  // Filter applications based on user access
  const accessibleApplications = filterLoanApplicationsByUser(applications, mockData.customers, user!)

  // Apply partner filter
  const filteredApplications = partnerFilter === "all"
    ? accessibleApplications
    : accessibleApplications.filter(app => {
      const customer = mockData.customers.find(c => c.id === app.customerId)
      return customer?.partnerId?.toString() === partnerFilter
    })

  // Get available partners for filter (admin sees all, staff sees only their partner)
  const availablePartners = user?.role === "admin"
    ? mockData.partners
    : mockData.partners.filter(p => p.id === user?.partnerId)

  const [formData, setFormData] = useState({
    customerId: "",
    amount: "",
    productId: "",
    product: "",
    purpose: "",
    remarks: "",
    documents: [] as string[],
    coApplicantIds: [] as number[],
    guarantorIds: [] as number[],
    interestRate: "",
    tenureMonths: "",
    repaymentFrequency: "Monthly",
  })

  const [selectedCoApplicants, setSelectedCoApplicants] = useState<number[]>([])
  const [selectedGuarantors, setSelectedGuarantors] = useState<number[]>([])
  const [documentFiles, setDocumentFiles] = useState<string[]>([])

  const activeProducts = getActiveProducts();

  const handleCreateApplication = () => {
    // Validation
    if (!formData.customerId || !formData.amount || !formData.productId || !formData.purpose) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const selectedProduct = getProductById(Number(formData.productId))
    const selectedCustomer = mockData.customers.find(c => c.id === Number(formData.customerId))

    if (!selectedProduct || !selectedCustomer) {
      toast({
        title: "Error",
        description: "Invalid product or customer selection",
        variant: "destructive"
      })
      return
    }

    // Check eligibility
    const eligibility = checkCustomerEligibility(selectedProduct, selectedCustomer)
    if (!eligibility.isEligible) {
      toast({
        title: "Eligibility Check Failed",
        description: eligibility.reasons.join(", "),
        variant: "destructive"
      })
      return
    }

    // Validate amount and tenure
    const amountValidation = validateLoanAmount(selectedProduct, Number(formData.amount))
    const tenureValidation = validateLoanTenure(selectedProduct, Number(formData.tenureMonths))

    if (!amountValidation.isValid || !tenureValidation.isValid) {
      toast({
        title: "Validation Error",
        description: `${amountValidation.message || ""} ${tenureValidation.message || ""}`.trim(),
        variant: "destructive"
      })
      return
    }

    const newApplication: LoanApplication = {
      id: getNextId(applications),
      customerId: Number.parseInt(formData.customerId),
      amount: Number.parseFloat(formData.amount),
      product: formData.product,
      purpose: formData.purpose,
      interestRate: Number.parseFloat(formData.interestRate),
      tenureMonths: Number.parseInt(formData.tenureMonths),
      repaymentFrequency: formData.repaymentFrequency as "Monthly" | "Weekly" | "Daily" | "Quarterly",
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remarks: formData.remarks,
      documents: documentFiles,
      coApplicantIds: selectedCoApplicants,
      guarantorIds: selectedGuarantors,
    }

    const updatedApplications = [...applications, newApplication]
    setApplications(updatedApplications)
    mockData.loanApplications = updatedApplications

    // Reset form
    setFormData({ customerId: "", amount: "", productId: "", product: "", purpose: "", remarks: "", documents: [], coApplicantIds: [], guarantorIds: [], interestRate: "", tenureMonths: "", repaymentFrequency: "Monthly" })
    setSelectedCoApplicants([])
    setSelectedGuarantors([])
    setDocumentFiles([])
    setIsCreateOpen(false)

    toast({
      title: "Application Created",
      description: "Loan application has been created successfully",
    })
  }

  const handleStatusUpdate = (applicationId: number, newStatus: LoanApplication["status"]) => {
    const updatedApplications = applications.map((app) =>
      app.id === applicationId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app,
    )
    setApplications(updatedApplications)
    mockData.loanApplications = updatedApplications

    // If approved, create a loan
    if (newStatus === "Approved") {
      const application = updatedApplications.find((app) => app.id === applicationId)
      if (application) {
        const emi = calculateEMI(application.amount, application.interestRate, application.tenureMonths)
        const newLoan: Loan = {
          id: getNextId(mockData.loans),
          customerId: application.customerId,
          applicationId: application.id,
          amount: application.amount,
          interestRate: application.interestRate,
          tenureMonths: application.tenureMonths,
          emi,
          disbursementDate: new Date().toISOString(),
          gracePeriodDays: 0, // Default value
          repaymentFrequency: application.repaymentFrequency,
          amortizationType: "EMI", // Default value
          status: "Active",
          coApplicantIds: application.coApplicantIds || [],
          guarantorIds: application.guarantorIds || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        mockData.loans.push(newLoan)

        toast({
          title: "Loan Created",
          description: `Loan has been created with EMI: ${formatCurrency(emi)}`,
        })
      }
    }
  }

  const getStatusBadge = (status: LoanApplication["status"]) => {
    const variants = {
      Draft: "secondary",
      Submitted: "default",
      "Under Review": "default",
      Approved: "default",
      Rejected: "destructive",
    } as const
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      Submitted: "bg-blue-100 text-blue-800",
      "Under Review": "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    }
    return <Badge variant={variants[status]} className={colors[status]}>{status}</Badge>
  }

  // Filter customers based on user access for the form
  const accessibleCustomers = user?.role === "admin"
    ? mockData.customers
    : mockData.customers.filter(customer => customer.partnerId === user?.partnerId)

  // Auto-fill product details and validate
  const handleProductChange = (productId: string) => {
    const product = getProductById(Number(productId));
    if (product) {
      setFormData({
        ...formData,
        productId: product.id.toString(),
        product: product.name,
        interestRate: product.interestRate.toString(),
        tenureMonths: product.minTenureMonths.toString(),
      });
    }
  };

  // Handle amount change to recalculate EMI
  const handleAmountChange = (amount: string) => {
    setFormData({ ...formData, amount })
  }

  // Handle tenure change to recalculate EMI
  const handleTenureChange = (tenure: string) => {
    setFormData({ ...formData, tenureMonths: tenure })
  }

  // Handle document upload
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileNames = Array.from(files).map(file => file.name)
      setDocumentFiles(prev => [...prev, ...fileNames])
    }
  }

  // Calculate EMI and other details
  const selectedProduct = formData.productId ? getProductById(Number(formData.productId)) : undefined;
  const selectedCustomer = formData.customerId ? mockData.customers.find(c => c.id === Number(formData.customerId)) : undefined;
  const eligibility = selectedProduct && selectedCustomer ? checkCustomerEligibility(selectedProduct, selectedCustomer) : undefined;
  const amountValidation = selectedProduct && formData.amount ? validateLoanAmount(selectedProduct, Number(formData.amount)) : { isValid: true };
  const tenureValidation = selectedProduct && formData.tenureMonths ? validateLoanTenure(selectedProduct, Number(formData.tenureMonths)) : { isValid: true };

  // Calculate EMI
  const calculatedEMI = selectedProduct && formData.amount && formData.tenureMonths
    ? calculateEMI(Number(formData.amount), selectedProduct.interestRate, Number(formData.tenureMonths))
    : 0;

  const totalInterest = selectedProduct && formData.amount && formData.tenureMonths
    ? calculateTotalInterest(Number(formData.amount), calculatedEMI, Number(formData.tenureMonths))
    : 0;

  const totalAmount = selectedProduct && formData.amount && formData.tenureMonths
    ? calculateTotalAmount(Number(formData.amount), calculatedEMI, Number(formData.tenureMonths))
    : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loan Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage loan applications and approvals
            {user?.role === "staff" && user.partnerId && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Partner: {getPartnerName(user.partnerId, mockData.partners)}
              </span>
            )}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Loan Application</DialogTitle>
              <DialogDescription>Create a new loan application for a customer.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Primary Applicant *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} {customer.partnerId && `(${getPartnerName(customer.partnerId, mockData.partners)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product">Loan Product *</Label>
                <Select
                  value={formData.productId || ""}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - {product.interestRate}% p.a.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Product Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="ml-2 font-medium">{selectedProduct.interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processing Fee:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedProduct.processingFee)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Min Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedProduct.minAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedProduct.maxAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Min Tenure:</span>
                      <span className="ml-2 font-medium">{selectedProduct.minTenureMonths} months</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Tenure:</span>
                      <span className="ml-2 font-medium">{selectedProduct.maxTenureMonths} months</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="amount">Loan Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Enter loan amount"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tenure">Tenure (Months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  value={formData.tenureMonths}
                  onChange={(e) => handleTenureChange(e.target.value)}
                  placeholder="Enter tenure in months"
                />
              </div>

              {calculatedEMI > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    EMI Calculation
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly EMI:</span>
                      <span className="ml-2 font-medium text-green-700">{formatCurrency(calculatedEMI)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Interest:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalInterest)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processing Fee:</span>
                      <span className="ml-2 font-medium">{formatCurrency(selectedProduct?.processingFee || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {eligibility && !eligibility.isEligible && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    Eligibility Issues
                  </h4>
                  <ul className="list-disc ml-5 text-sm text-red-700">
                    {eligibility.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {amountValidation && !amountValidation.isValid && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 text-sm">
                  {amountValidation.message}
                </div>
              )}

              {tenureValidation && !tenureValidation.isValid && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 text-sm">
                  {tenureValidation.message}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g., Home renovation, Business expansion"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repaymentFrequency">Repayment Frequency</Label>
                <Select
                  value={formData.repaymentFrequency}
                  onValueChange={(value) => setFormData({ ...formData, repaymentFrequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Co-Applicants Section */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Co-Applicants
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedCoApplicants.includes(Number(value))) {
                      setSelectedCoApplicants(prev => [...prev, Number(value)])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select co-applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleCustomers
                      .filter(c => c.id !== Number(formData.customerId) && !selectedCoApplicants.includes(c.id))
                      .map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedCoApplicants.length > 0 && (
                  <div className="space-y-2">
                    {selectedCoApplicants.map((customerId) => {
                      const customer = accessibleCustomers.find(c => c.id === customerId)
                      return customer ? (
                        <div key={customerId} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-sm">{customer.name} - {customer.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCoApplicants(prev => prev.filter(id => id !== customerId))}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* Guarantors Section */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Guarantors
                </Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !selectedGuarantors.includes(Number(value))) {
                      setSelectedGuarantors(prev => [...prev, Number(value)])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select guarantor" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleCustomers
                      .filter(c => c.id !== Number(formData.customerId) && !selectedGuarantors.includes(c.id))
                      .map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedGuarantors.length > 0 && (
                  <div className="space-y-2">
                    {selectedGuarantors.map((customerId) => {
                      const customer = accessibleCustomers.find(c => c.id === customerId)
                      return customer ? (
                        <div key={customerId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span className="text-sm">{customer.name} - {customer.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGuarantors(prev => prev.filter(id => id !== customerId))}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Documents
                </Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {documentFiles.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Selected files: {documentFiles.join(", ")}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes or remarks"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleCreateApplication}>
                Create Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              {filteredApplications.length} applications found
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const customer = mockData.customers.find((c) => c.id === application.customerId)
          const emi = calculateEMI(application.amount, application.interestRate, application.tenureMonths)
          return (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Application #{application.id} - {customer?.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>Amount: {formatCurrency(application.amount)}</span>
                      <span>EMI: {formatCurrency(emi)}</span>
                      <span>Product: {application.product}</span>
                      <span>Purpose: {application.purpose}</span>
                      {customer?.partnerId && (
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {getPartnerName(customer.partnerId, mockData.partners)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(application.status)}
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedApplication(application)
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
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
                    <p className="font-medium">{application.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Tenure</p>
                    <p className="font-medium">{application.tenureMonths} months</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Repayment</p>
                    <p className="font-medium">{application.repaymentFrequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Show co-applicants and guarantors */}
                {(application.coApplicantIds?.length > 0 || application.guarantorIds?.length > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-4 text-sm">
                      {application.coApplicantIds?.length > 0 && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Co-Applicants:
                          </p>
                          <p className="font-medium">
                            {application.coApplicantIds.map(id => {
                              const coApp = mockData.customers.find(c => c.id === id)
                              return coApp?.name
                            }).join(", ")}
                          </p>
                        </div>
                      )}
                      {application.guarantorIds?.length > 0 && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Guarantors:
                          </p>
                          <p className="font-medium">
                            {application.guarantorIds.map(id => {
                              const guarantor = mockData.customers.find(c => c.id === id)
                              return guarantor?.name
                            }).join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  {application.status === "Submitted" && (
                    <>
                      <Button onClick={() => handleStatusUpdate(application.id, "Under Review")}>
                        Start Review
                      </Button>
                    </>
                  )}
                  {application.status === "Under Review" && (
                    <>
                      <Button onClick={() => handleStatusUpdate(application.id, "Approved")}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="destructive" onClick={() => handleStatusUpdate(application.id, "Rejected")}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* View Application Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Application ID</Label>
                  <p className="text-sm font-medium">#{selectedApplication.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <Label>Primary Applicant</Label>
                  <p className="text-sm font-medium">
                    {mockData.customers.find((c) => c.id === selectedApplication.customerId)?.name}
                  </p>
                </div>
                <div>
                  <Label>Loan Amount</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedApplication.amount)}</p>
                </div>
                <div>
                  <Label>Product</Label>
                  <p className="text-sm font-medium">{selectedApplication.product}</p>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <p className="text-sm font-medium">{selectedApplication.purpose}</p>
                </div>
                <div>
                  <Label>Interest Rate</Label>
                  <p className="text-sm font-medium">{selectedApplication.interestRate}%</p>
                </div>
                <div>
                  <Label>Tenure</Label>
                  <p className="text-sm font-medium">{selectedApplication.tenureMonths} months</p>
                </div>
                <div>
                  <Label>Repayment Frequency</Label>
                  <p className="text-sm font-medium">{selectedApplication.repaymentFrequency}</p>
                </div>
                <div>
                  <Label>EMI Amount</Label>
                  <p className="text-sm font-medium">{formatCurrency(calculateEMI(selectedApplication.amount, selectedApplication.interestRate, selectedApplication.tenureMonths))}</p>
                </div>
                <div>
                  <Label>Applied Date</Label>
                  <p className="text-sm font-medium">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm font-medium">{new Date(selectedApplication.updatedAt).toLocaleDateString()}</p>
                </div>
                {selectedApplication.remarks && (
                  <div className="col-span-2">
                    <Label>Remarks</Label>
                    <p className="text-sm font-medium">{selectedApplication.remarks}</p>
                  </div>
                )}
                {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                  <div className="col-span-2">
                    <Label>Documents</Label>
                    <ul className="text-sm font-medium">
                      {selectedApplication.documents.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApplication.coApplicantIds && selectedApplication.coApplicantIds.length > 0 && (
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Co-Applicants
                    </Label>
                    <ul className="text-sm font-medium">
                      {selectedApplication.coApplicantIds.map((id) => {
                        const customer = mockData.customers.find((c) => c.id === id)
                        return customer ? <li key={id}>{customer.name} - {customer.phone}</li> : null
                      })}
                    </ul>
                  </div>
                )}
                {selectedApplication.guarantorIds && selectedApplication.guarantorIds.length > 0 && (
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Guarantors
                    </Label>
                    <ul className="text-sm font-medium">
                      {selectedApplication.guarantorIds.map((id) => {
                        const customer = mockData.customers.find((c) => c.id === id)
                        return customer ? <li key={id}>{customer.name} - {customer.phone}</li> : null
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
