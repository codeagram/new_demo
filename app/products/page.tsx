"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockData, getNextId } from "@/lib/mock-data"
import type { LoanProduct } from "@/lib/types"
import {
    Plus,
    Edit,
    Eye,
    CheckCircle,
    XCircle,
    DollarSign,
    Calendar,
    FileText,
} from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

export default function ProductsPage() {
    const [products, setProducts] = useState(mockData.loanProducts)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null)
    const [activeTab, setActiveTab] = useState("all")

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        category: "Personal" as LoanProduct["category"],
        minAmount: "",
        maxAmount: "",
        minTenureMonths: "",
        maxTenureMonths: "",
        interestRate: "",
        processingFee: "",
        prepaymentPenalty: "",
        latePaymentPenalty: "",
        minAge: "",
        maxAge: "",
        minIncome: "",
        requiredDocuments: [] as string[],
        creditScoreRequired: false,
    })

    const handleCreateProduct = () => {
        const newProduct: LoanProduct = {
            id: getNextId(products),
            name: formData.name,
            code: formData.code,
            description: formData.description,
            category: formData.category,
            minAmount: Number.parseFloat(formData.minAmount),
            maxAmount: Number.parseFloat(formData.maxAmount),
            minTenureMonths: Number.parseInt(formData.minTenureMonths),
            maxTenureMonths: Number.parseInt(formData.maxTenureMonths),
            interestRate: Number.parseFloat(formData.interestRate),
            processingFee: Number.parseFloat(formData.processingFee),
            prepaymentPenalty: Number.parseFloat(formData.prepaymentPenalty),
            latePaymentPenalty: Number.parseFloat(formData.latePaymentPenalty),
            eligibilityCriteria: {
                minAge: Number.parseInt(formData.minAge),
                maxAge: Number.parseInt(formData.maxAge),
                minIncome: Number.parseFloat(formData.minIncome),
                requiredDocuments: formData.requiredDocuments,
                creditScoreRequired: formData.creditScoreRequired,
            },
            status: "Active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const updatedProducts = [...products, newProduct]
        setProducts(updatedProducts)
        mockData.loanProducts = updatedProducts

        setFormData({
            name: "", code: "", description: "", category: "Personal" as LoanProduct["category"],
            minAmount: "", maxAmount: "", minTenureMonths: "", maxTenureMonths: "",
            interestRate: "", processingFee: "", prepaymentPenalty: "", latePaymentPenalty: "",
            minAge: "", maxAge: "", minIncome: "", requiredDocuments: [], creditScoreRequired: false,
        })
        setIsCreateOpen(false)
    }

    const handleEditProduct = () => {
        if (!selectedProduct) return

        const updatedProduct: LoanProduct = {
            ...selectedProduct,
            name: formData.name,
            code: formData.code,
            description: formData.description,
            category: formData.category,
            minAmount: Number.parseFloat(formData.minAmount),
            maxAmount: Number.parseFloat(formData.maxAmount),
            minTenureMonths: Number.parseInt(formData.minTenureMonths),
            maxTenureMonths: Number.parseInt(formData.maxTenureMonths),
            interestRate: Number.parseFloat(formData.interestRate),
            processingFee: Number.parseFloat(formData.processingFee),
            prepaymentPenalty: Number.parseFloat(formData.prepaymentPenalty),
            latePaymentPenalty: Number.parseFloat(formData.latePaymentPenalty),
            eligibilityCriteria: {
                minAge: Number.parseInt(formData.minAge),
                maxAge: Number.parseInt(formData.maxAge),
                minIncome: Number.parseFloat(formData.minIncome),
                requiredDocuments: formData.requiredDocuments,
                creditScoreRequired: formData.creditScoreRequired,
            },
            updatedAt: new Date().toISOString(),
        }

        const updatedProducts = products.map(p => p.id === selectedProduct.id ? updatedProduct : p)
        setProducts(updatedProducts)
        mockData.loanProducts = updatedProducts

        setIsEditOpen(false)
        setSelectedProduct(null)
    }

    const handleStatusToggle = (productId: number) => {
        const updatedProducts = products.map(product =>
            product.id === productId
                ? { ...product, status: (product.status === "Active" ? "Inactive" : "Active") as LoanProduct["status"], updatedAt: new Date().toISOString() }
                : product
        )
        setProducts(updatedProducts)
        mockData.loanProducts = updatedProducts
    }

    const getStatusBadge = (status: LoanProduct["status"]) => {
        const colors = {
            Active: "bg-green-100 text-green-800",
            Inactive: "bg-gray-100 text-gray-800",
        }
        return <Badge className={colors[status]}>{status}</Badge>
    }

    const getCategoryBadge = (category: LoanProduct["category"]) => {
        const colors = {
            Personal: "bg-blue-100 text-blue-800",
            Business: "bg-purple-100 text-purple-800",
            Home: "bg-green-100 text-green-800",
            Vehicle: "bg-orange-100 text-orange-800",
            Education: "bg-indigo-100 text-indigo-800",
            Other: "bg-gray-100 text-gray-800",
        }
        return <Badge className={colors[category]}>{category}</Badge>
    }

    const filteredProducts = activeTab === "all"
        ? products
        : products.filter(product => product.category === activeTab)

    const documentOptions = [
        "PAN Card", "Aadhaar Card", "Bank Statements", "Salary Slips",
        "Business Registration", "IT Returns", "Property Documents",
        "Driving License", "Admission Letter", "Fee Structure",
        "Co-applicant Documents", "Address Proof", "Income Proof"
    ]

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loan Products</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage loan products and their configurations</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Loan Product</DialogTitle>
                            <DialogDescription>Configure a new loan product with eligibility criteria and terms.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Product Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value as LoanProduct["category"] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Personal">Personal</SelectItem>
                                        <SelectItem value="Business">Business</SelectItem>
                                        <SelectItem value="Home">Home</SelectItem>
                                        <SelectItem value="Vehicle">Vehicle</SelectItem>
                                        <SelectItem value="Education">Education</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Tabs defaultValue="terms" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="terms">Loan Terms</TabsTrigger>
                                    <TabsTrigger value="fees">Fees & Penalties</TabsTrigger>
                                    <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                                </TabsList>

                                <TabsContent value="terms" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="minAmount">Minimum Amount</Label>
                                            <Input
                                                id="minAmount"
                                                type="number"
                                                value={formData.minAmount}
                                                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="maxAmount">Maximum Amount</Label>
                                            <Input
                                                id="maxAmount"
                                                type="number"
                                                value={formData.maxAmount}
                                                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="minTenureMonths">Minimum Tenure (Months)</Label>
                                            <Input
                                                id="minTenureMonths"
                                                type="number"
                                                value={formData.minTenureMonths}
                                                onChange={(e) => setFormData({ ...formData, minTenureMonths: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="maxTenureMonths">Maximum Tenure (Months)</Label>
                                            <Input
                                                id="maxTenureMonths"
                                                type="number"
                                                value={formData.maxTenureMonths}
                                                onChange={(e) => setFormData({ ...formData, maxTenureMonths: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="interestRate">Interest Rate (%)</Label>
                                        <Input
                                            id="interestRate"
                                            type="number"
                                            step="0.1"
                                            value={formData.interestRate}
                                            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="fees" className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="processingFee">Processing Fee</Label>
                                            <Input
                                                id="processingFee"
                                                type="number"
                                                value={formData.processingFee}
                                                onChange={(e) => setFormData({ ...formData, processingFee: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="prepaymentPenalty">Prepayment Penalty (%)</Label>
                                            <Input
                                                id="prepaymentPenalty"
                                                type="number"
                                                step="0.1"
                                                value={formData.prepaymentPenalty}
                                                onChange={(e) => setFormData({ ...formData, prepaymentPenalty: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="latePaymentPenalty">Late Payment Penalty (%)</Label>
                                            <Input
                                                id="latePaymentPenalty"
                                                type="number"
                                                step="0.1"
                                                value={formData.latePaymentPenalty}
                                                onChange={(e) => setFormData({ ...formData, latePaymentPenalty: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="eligibility" className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="minAge">Minimum Age</Label>
                                            <Input
                                                id="minAge"
                                                type="number"
                                                value={formData.minAge}
                                                onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="maxAge">Maximum Age</Label>
                                            <Input
                                                id="maxAge"
                                                type="number"
                                                value={formData.maxAge}
                                                onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="minIncome">Minimum Income</Label>
                                            <Input
                                                id="minIncome"
                                                type="number"
                                                value={formData.minIncome}
                                                onChange={(e) => setFormData({ ...formData, minIncome: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Required Documents</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                            {documentOptions.map((doc) => (
                                                <label key={doc} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.requiredDocuments.includes(doc)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredDocuments: [...formData.requiredDocuments, doc]
                                                                })
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    requiredDocuments: formData.requiredDocuments.filter(d => d !== doc)
                                                                })
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm">{doc}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="creditScoreRequired"
                                            checked={formData.creditScoreRequired}
                                            onChange={(e) => setFormData({ ...formData, creditScoreRequired: e.target.checked })}
                                        />
                                        <Label htmlFor="creditScoreRequired">Credit Score Required</Label>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleCreateProduct}>
                                Create Product
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Product Categories Filter */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All Products</TabsTrigger>
                    <TabsTrigger value="Personal">Personal</TabsTrigger>
                    <TabsTrigger value="Business">Business</TabsTrigger>
                    <TabsTrigger value="Home">Home</TabsTrigger>
                    <TabsTrigger value="Vehicle">Vehicle</TabsTrigger>
                    <TabsTrigger value="Education">Education</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Products Grid */}
            <div className="grid gap-4">
                {filteredProducts.map((product) => (
                    <Card key={product.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        {product.name}
                                        {getCategoryBadge(product.category)}
                                        {getStatusBadge(product.status)}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {product.code}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {product.interestRate}% p.a.
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4" />
                                            {formatCurrency(product.minAmount)} - {formatCurrency(product.maxAmount)}
                                        </span>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedProduct(product)
                                            setIsViewOpen(true)
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedProduct(product)
                                            setFormData({
                                                name: product.name,
                                                code: product.code,
                                                description: product.description,
                                                category: product.category,
                                                minAmount: product.minAmount.toString(),
                                                maxAmount: product.maxAmount.toString(),
                                                minTenureMonths: product.minTenureMonths.toString(),
                                                maxTenureMonths: product.maxTenureMonths.toString(),
                                                interestRate: product.interestRate.toString(),
                                                processingFee: product.processingFee.toString(),
                                                prepaymentPenalty: product.prepaymentPenalty.toString(),
                                                latePaymentPenalty: product.latePaymentPenalty.toString(),
                                                minAge: product.eligibilityCriteria.minAge.toString(),
                                                maxAge: product.eligibilityCriteria.maxAge.toString(),
                                                minIncome: product.eligibilityCriteria.minIncome.toString(),
                                                requiredDocuments: product.eligibilityCriteria.requiredDocuments,
                                                creditScoreRequired: product.eligibilityCriteria.creditScoreRequired,
                                            })
                                            setIsEditOpen(true)
                                        }}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant={product.status === "Active" ? "destructive" : "default"}
                                        size="sm"
                                        onClick={() => handleStatusToggle(product.id)}
                                    >
                                        {product.status === "Active" ? (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Activate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Interest Rate</p>
                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatPercentage(product.interestRate)}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">per annum</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Loan Range</p>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(product.minAmount)}</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">to {formatCurrency(product.maxAmount)}</p>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Tenure</p>
                                    <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{product.minTenureMonths}-{product.maxTenureMonths}</p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400">months</p>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Processing Fee</p>
                                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(product.processingFee)}</p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400">one-time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View Product Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Product Details</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Product Name</Label>
                                    <p className="text-sm font-medium">{selectedProduct.name}</p>
                                </div>
                                <div>
                                    <Label>Product Code</Label>
                                    <p className="text-sm font-medium">{selectedProduct.code}</p>
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <div className="mt-1">{getCategoryBadge(selectedProduct.category)}</div>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                                </div>
                            </div>

                            <div>
                                <Label>Description</Label>
                                <p className="text-sm font-medium">{selectedProduct.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Loan Amount Range</Label>
                                    <p className="text-sm font-medium">{formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}</p>
                                </div>
                                <div>
                                    <Label>Tenure Range</Label>
                                    <p className="text-sm font-medium">{selectedProduct.minTenureMonths} - {selectedProduct.maxTenureMonths} months</p>
                                </div>
                                <div>
                                    <Label>Interest Rate</Label>
                                    <p className="text-sm font-medium">{formatPercentage(selectedProduct.interestRate)} per annum</p>
                                </div>
                                <div>
                                    <Label>Processing Fee</Label>
                                    <p className="text-sm font-medium">{formatCurrency(selectedProduct.processingFee)}</p>
                                </div>
                            </div>

                            <div>
                                <Label>Penalties</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-sm text-gray-600">Prepayment Penalty</p>
                                        <p className="text-sm font-medium">{formatPercentage(selectedProduct.prepaymentPenalty)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Late Payment Penalty</p>
                                        <p className="text-sm font-medium">{formatPercentage(selectedProduct.latePaymentPenalty)}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label>Eligibility Criteria</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-sm text-gray-600">Age Range</p>
                                        <p className="text-sm font-medium">{selectedProduct.eligibilityCriteria.minAge} - {selectedProduct.eligibilityCriteria.maxAge} years</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Minimum Income</p>
                                        <p className="text-sm font-medium">{formatCurrency(selectedProduct.eligibilityCriteria.minIncome)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Credit Score Required</p>
                                        <p className="text-sm font-medium">{selectedProduct.eligibilityCriteria.creditScoreRequired ? "Yes" : "No"}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label>Required Documents</Label>
                                <div className="mt-2">
                                    {selectedProduct.eligibilityCriteria.requiredDocuments.map((doc, index) => (
                                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                                            {doc}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Loan Product</DialogTitle>
                        <DialogDescription>Update product configuration and eligibility criteria.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Product Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Product Code</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value as LoanProduct["category"] })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Home">Home</SelectItem>
                                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                                    <SelectItem value="Education">Education</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Tabs defaultValue="terms" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="terms">Loan Terms</TabsTrigger>
                                <TabsTrigger value="fees">Fees & Penalties</TabsTrigger>
                                <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
                            </TabsList>

                            <TabsContent value="terms" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-minAmount">Minimum Amount</Label>
                                        <Input
                                            id="edit-minAmount"
                                            type="number"
                                            value={formData.minAmount}
                                            onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-maxAmount">Maximum Amount</Label>
                                        <Input
                                            id="edit-maxAmount"
                                            type="number"
                                            value={formData.maxAmount}
                                            onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-minTenureMonths">Minimum Tenure (Months)</Label>
                                        <Input
                                            id="edit-minTenureMonths"
                                            type="number"
                                            value={formData.minTenureMonths}
                                            onChange={(e) => setFormData({ ...formData, minTenureMonths: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-maxTenureMonths">Maximum Tenure (Months)</Label>
                                        <Input
                                            id="edit-maxTenureMonths"
                                            type="number"
                                            value={formData.maxTenureMonths}
                                            onChange={(e) => setFormData({ ...formData, maxTenureMonths: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-interestRate">Interest Rate (%)</Label>
                                    <Input
                                        id="edit-interestRate"
                                        type="number"
                                        step="0.1"
                                        value={formData.interestRate}
                                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="fees" className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-processingFee">Processing Fee</Label>
                                        <Input
                                            id="edit-processingFee"
                                            type="number"
                                            value={formData.processingFee}
                                            onChange={(e) => setFormData({ ...formData, processingFee: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-prepaymentPenalty">Prepayment Penalty (%)</Label>
                                        <Input
                                            id="edit-prepaymentPenalty"
                                            type="number"
                                            step="0.1"
                                            value={formData.prepaymentPenalty}
                                            onChange={(e) => setFormData({ ...formData, prepaymentPenalty: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-latePaymentPenalty">Late Payment Penalty (%)</Label>
                                        <Input
                                            id="edit-latePaymentPenalty"
                                            type="number"
                                            step="0.1"
                                            value={formData.latePaymentPenalty}
                                            onChange={(e) => setFormData({ ...formData, latePaymentPenalty: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="eligibility" className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-minAge">Minimum Age</Label>
                                        <Input
                                            id="edit-minAge"
                                            type="number"
                                            value={formData.minAge}
                                            onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-maxAge">Maximum Age</Label>
                                        <Input
                                            id="edit-maxAge"
                                            type="number"
                                            value={formData.maxAge}
                                            onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-minIncome">Minimum Income</Label>
                                        <Input
                                            id="edit-minIncome"
                                            type="number"
                                            value={formData.minIncome}
                                            onChange={(e) => setFormData({ ...formData, minIncome: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Required Documents</Label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {documentOptions.map((doc) => (
                                            <label key={doc} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requiredDocuments.includes(doc)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                requiredDocuments: [...formData.requiredDocuments, doc]
                                                            })
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                requiredDocuments: formData.requiredDocuments.filter(d => d !== doc)
                                                            })
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm">{doc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="edit-creditScoreRequired"
                                        checked={formData.creditScoreRequired}
                                        onChange={(e) => setFormData({ ...formData, creditScoreRequired: e.target.checked })}
                                    />
                                    <Label htmlFor="edit-creditScoreRequired">Credit Score Required</Label>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleEditProduct}>
                            Update Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 