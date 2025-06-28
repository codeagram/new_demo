"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import type { Partner } from "@/lib/types"
import { Plus, MapPin, Building, Users, CheckCircle, XCircle, Edit } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function PartnersPage() {
    const { user } = useAuth()
    const [partners, setPartners] = useState(mockData.partners)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        status: "Active",
        servicingPincodes: "",
    })

    const handleCreatePartner = () => {
        const pincodes = formData.servicingPincodes
            .split(",")
            .map(p => p.trim())
            .filter(p => p.length === 6)

        const newPartner: Partner = {
            id: getNextId(partners),
            name: formData.name,
            code: formData.code,
            status: formData.status as "Active" | "Inactive",
            servicingPincodes: pincodes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const updatedPartners = [...partners, newPartner]
        setPartners(updatedPartners)
        mockData.partners = updatedPartners

        setFormData({
            name: "", code: "", status: "Active", servicingPincodes: ""
        })
        setIsCreateOpen(false)
    }

    const handleEditPartner = () => {
        if (!selectedPartner) return

        const pincodes = formData.servicingPincodes
            .split(",")
            .map(p => p.trim())
            .filter(p => p.length === 6)

        const updatedPartner: Partner = {
            ...selectedPartner,
            name: formData.name,
            code: formData.code,
            status: formData.status as "Active" | "Inactive",
            servicingPincodes: pincodes,
            updatedAt: new Date().toISOString(),
        }

        const updatedPartners = partners.map(p =>
            p.id === selectedPartner.id ? updatedPartner : p
        )
        setPartners(updatedPartners)
        mockData.partners = updatedPartners

        setFormData({
            name: "", code: "", status: "Active", servicingPincodes: ""
        })
        setIsEditOpen(false)
        setSelectedPartner(null)
    }

    const handleEditClick = (partner: Partner) => {
        setSelectedPartner(partner)
        setFormData({
            name: partner.name,
            code: partner.code,
            status: partner.status,
            servicingPincodes: partner.servicingPincodes.join(", "),
        })
        setIsEditOpen(true)
    }

    const getStatusBadge = (status: Partner["status"]) => {
        const colors = {
            Active: "bg-green-100 text-green-800",
            Inactive: "bg-red-100 text-red-800",
        }
        const icons = {
            Active: CheckCircle,
            Inactive: XCircle,
        }
        const Icon = icons[status]
        return (
            <Badge className={colors[status]}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        )
    }

    const getPartnerStats = (partnerId: number) => {
        const customers = mockData.customers.filter(c => c.partnerId === partnerId)
        const loans = mockData.loans.filter(l => {
            const customer = mockData.customers.find(c => c.id === l.customerId)
            return customer?.partnerId === partnerId
        })
        const applications = mockData.loanApplications.filter(a => {
            const customer = mockData.customers.find(c => c.id === a.customerId)
            return customer?.partnerId === partnerId
        })

        return {
            customers: customers.length,
            loans: loans.length,
            applications: applications.length,
        }
    }

    // Only admin can access this page
    if (user?.role !== "admin") {
        return (
            <div className="p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Only administrators can access partner management.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Partners</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage partner organizations and their servicing areas</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Partner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Partner</DialogTitle>
                            <DialogDescription>Add a new partner organization with their servicing pincodes.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Partner Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter partner name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Partner Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="Enter partner code"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Servicing Pincodes</Label>
                                <Input
                                    value={formData.servicingPincodes}
                                    onChange={(e) => setFormData({ ...formData, servicingPincodes: e.target.value })}
                                    placeholder="Enter pincodes separated by commas (e.g., 110001, 110002, 110003)"
                                />
                                <p className="text-sm text-gray-500">Enter 6-digit pincodes separated by commas</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleCreatePartner}>
                                Create Partner
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {partners.map((partner) => {
                    const stats = getPartnerStats(partner.id)
                    return (
                        <Card key={partner.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building className="w-5 h-5" />
                                            {partner.name}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium">Code:</span> {partner.code}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {partner.servicingPincodes.length} pincodes
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {getStatusBadge(partner.status)}
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(partner)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Customers</p>
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.customers}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Loans</p>
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.loans}</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Applications</p>
                                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.applications}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Staff</p>
                                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                            {mockData.users.filter(u => u.partnerId === partner.id).length}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">Servicing Pincodes:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {partner.servicingPincodes.map((pincode) => (
                                            <Badge key={pincode} variant="outline">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {pincode}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Edit Partner Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Partner</DialogTitle>
                        <DialogDescription>Update partner information and servicing areas.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Partner Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter partner name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Partner Code</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Enter partner code"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Servicing Pincodes</Label>
                            <Input
                                value={formData.servicingPincodes}
                                onChange={(e) => setFormData({ ...formData, servicingPincodes: e.target.value })}
                                placeholder="Enter pincodes separated by commas (e.g., 110001, 110002, 110003)"
                            />
                            <p className="text-sm text-gray-500">Enter 6-digit pincodes separated by commas</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleEditPartner}>
                            Update Partner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 