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
import type { Customer, Address } from "@/lib/types"
import { Plus, Eye, MapPin, User, Phone, Mail, Calendar, DollarSign, Shield, CheckCircle, XCircle, Clock, Building, Filter } from "lucide-react"
import { formatCurrency, filterCustomersByUser, assignPartnerByPincode, getPartnerName, isValidPincode } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState(mockData.customers)
  const [addresses, setAddresses] = useState(mockData.addresses)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAddressOpen, setIsAddressOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [partnerFilter, setPartnerFilter] = useState<string>("all")

  // Filter customers based on user access
  const accessibleCustomers = filterCustomersByUser(customers, user!)

  // Apply partner filter
  const filteredCustomers = partnerFilter === "all"
    ? accessibleCustomers
    : accessibleCustomers.filter(customer => customer.partnerId?.toString() === partnerFilter)

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    guardianName: "",
    occupation: "",
    incomeSource: "",
    monthlyIncome: "",
    kycStatus: "NotStarted",
    pincode: "",
  })

  const [addressForm, setAddressForm] = useState({
    customerId: "",
    type: "permanent",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  })

  const handleCreateCustomer = () => {
    // Validate pincode
    if (!isValidPincode(formData.pincode)) {
      alert("Please enter a valid 6-digit pincode")
      return
    }

    // Assign partner based on pincode
    const assignedPartner = assignPartnerByPincode(formData.pincode, mockData.partners)

    const newCustomer: Customer = {
      id: getNextId(customers),
      ...formData,
      gender: formData.gender as "Male" | "Female" | "Other",
      monthlyIncome: formData.monthlyIncome ? Number.parseFloat(formData.monthlyIncome) : undefined,
      kycStatus: formData.kycStatus as "NotStarted" | "Pending" | "Verified" | "Rejected",
      pincode: formData.pincode,
      partnerId: assignedPartner?.id,
      createdAt: new Date().toISOString(),
    }

    const updatedCustomers = [...customers, newCustomer]
    setCustomers(updatedCustomers)
    mockData.customers = updatedCustomers

    setFormData({
      name: "", phone: "", email: "", dob: "", gender: "",
      guardianName: "", occupation: "", incomeSource: "", monthlyIncome: "", kycStatus: "NotStarted", pincode: ""
    })
    setIsCreateOpen(false)
  }

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: getNextId(addresses),
      customerId: Number.parseInt(addressForm.customerId),
      type: addressForm.type as "permanent" | "residence" | "office",
      line1: addressForm.line1,
      line2: addressForm.line2,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
      isVerified: false,
    }

    const updatedAddresses = [...addresses, newAddress]
    setAddresses(updatedAddresses)
    mockData.addresses = updatedAddresses

    setAddressForm({
      customerId: "", type: "permanent", line1: "", line2: "", city: "", state: "", pincode: ""
    })
    setIsAddressOpen(false)
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewOpen(true)
  }

  const getKYCStatusBadge = (status: Customer["kycStatus"]) => {
    const colors = {
      NotStarted: "bg-gray-100 text-gray-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Verified: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    }
    const icons = {
      NotStarted: Clock,
      Pending: Clock,
      Verified: CheckCircle,
      Rejected: XCircle,
    }
    const Icon = icons[status]
    return (
      <Badge className={colors[status]}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getAddressTypeBadge = (type: Address["type"]) => {
    const colors = {
      permanent: "bg-blue-100 text-blue-800",
      residence: "bg-green-100 text-green-800",
      office: "bg-purple-100 text-purple-800",
    }
    return <Badge className={colors[type]}>{type}</Badge>
  }

  const getCustomerLoans = (customerId: number) => {
    return mockData.loans.filter(loan => loan.customerId === customerId)
  }

  const getCustomerApplications = (customerId: number) => {
    return mockData.loanApplications.filter(app => app.customerId === customerId)
  }

  // Get available partners for filter (admin sees all, staff sees only their partner)
  const availablePartners = user?.role === "admin"
    ? mockData.partners
    : mockData.partners.filter(p => p.id === user?.partnerId)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your customer database
            {user?.role === "staff" && user.partnerId && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Partner: {getPartnerName(user.partnerId, mockData.partners)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddressOpen} onOpenChange={setIsAddressOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Customer Address</DialogTitle>
                <DialogDescription>Add a new address for an existing customer.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Customer</Label>
                  <Select
                    value={addressForm.customerId}
                    onValueChange={(value) => setAddressForm({ ...addressForm, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Address Type</Label>
                  <Select
                    value={addressForm.type}
                    onValueChange={(value) => setAddressForm({ ...addressForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="residence">Residence</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    placeholder="Enter address line 1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Address Line 2 (Optional)</Label>
                  <Input
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                    placeholder="Enter address line 2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>City</Label>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Pincode</Label>
                  <Input
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAddress}>Add Address</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer profile with basic information.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Pincode *</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Guardian Name (Optional)</Label>
                  <Input
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="Enter guardian name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Occupation</Label>
                    <Input
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Income Source</Label>
                    <Select
                      value={formData.incomeSource}
                      onValueChange={(value) => setFormData({ ...formData, incomeSource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select income source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Pension">Pension</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Monthly Income</Label>
                    <Input
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                      placeholder="Enter monthly income"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>KYC Status</Label>
                    <Select
                      value={formData.kycStatus}
                      onValueChange={(value) => setFormData({ ...formData, kycStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select KYC status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NotStarted">Not Started</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Verified">Verified</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateCustomer}>Create Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              {filteredCustomers.length} customers found
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredCustomers.map((customer) => {
          const customerAddresses = addresses.filter(addr => addr.customerId === customer.id)
          const customerLoans = getCustomerLoans(customer.id)
          const customerApplications = getCustomerApplications(customer.id)

          return (
            <Card key={customer.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {customer.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {customer.pincode}
                      </span>
                      {customer.partnerId && (
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {getPartnerName(customer.partnerId, mockData.partners)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getKYCStatusBadge(customer.kycStatus)}
                    <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Age</p>
                    <p className="font-medium">
                      {customer.dob ? Math.floor((Date.now() - new Date(customer.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Occupation</p>
                    <p className="font-medium">{customer.occupation || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Monthly Income</p>
                    <p className="font-medium">{customer.monthlyIncome ? formatCurrency(customer.monthlyIncome) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Active Loans</p>
                    <p className="font-medium">{customerLoans.filter(loan => loan.status === "Active").length}</p>
                  </div>
                </div>

                {customerAddresses.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Addresses</h4>
                    <div className="grid gap-2">
                      {customerAddresses.map((address) => (
                        <div key={address.id} className="flex items-center gap-2 text-sm">
                          {getAddressTypeBadge(address.type)}
                          <span>{address.line1}, {address.city}, {address.pincode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete information about the customer</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="loans">Loans</TabsTrigger>
                  <TabsTrigger value="applications">Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Name</Label>
                      <p className="text-lg font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-lg">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-lg">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                      <p className="text-lg">{selectedCustomer.dob}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Gender</Label>
                      <p className="text-lg">{selectedCustomer.gender}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Pincode</Label>
                      <p className="text-lg">{selectedCustomer.pincode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Partner</Label>
                      <p className="text-lg">
                        {selectedCustomer.partnerId ? getPartnerName(selectedCustomer.partnerId, mockData.partners) : "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">KYC Status</Label>
                      <div className="mt-1">{getKYCStatusBadge(selectedCustomer.kycStatus)}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="addresses" className="space-y-4">
                  <div className="space-y-4">
                    {addresses.filter(addr => addr.customerId === selectedCustomer.id).map((address) => (
                      <Card key={address.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getAddressTypeBadge(address.type)}
                                <span className="text-sm text-gray-500">
                                  {address.isVerified ? "Verified" : "Not Verified"}
                                </span>
                              </div>
                              <p className="font-medium">{address.line1}</p>
                              {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                              <p className="text-gray-600">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="loans" className="space-y-4">
                  <div className="space-y-4">
                    {getCustomerLoans(selectedCustomer.id).map((loan) => (
                      <Card key={loan.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Loan #{loan.id}</p>
                              <p className="text-sm text-gray-600">{formatCurrency(loan.amount)}</p>
                            </div>
                            <Badge variant={loan.status === "Active" ? "default" : "secondary"}>
                              {loan.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="applications" className="space-y-4">
                  <div className="space-y-4">
                    {getCustomerApplications(selectedCustomer.id).map((app) => (
                      <Card key={app.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Application #{app.id}</p>
                              <p className="text-sm text-gray-600">{formatCurrency(app.amount)}</p>
                            </div>
                            <Badge variant={app.status === "Approved" ? "default" : "secondary"}>
                              {app.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
