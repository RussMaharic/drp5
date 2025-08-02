"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Search, Truck, MapPin, Clock } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

interface Delivery {
  id: string
  orderId: string
  trackingNo: string
  courier: string
  address: string
  city: string
  status: "pending" | "shipped" | "in_transit" | "delivered" | "failed"
  estimatedDelivery: string
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchDeliveries()
  }, [])

  useEffect(() => {
    filterDeliveries()
  }, [deliveries, searchTerm])

  const fetchDeliveries = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockDeliveries: Delivery[] = [
        {
          id: "DEL-001",
          orderId: "ORD-001",
          trackingNo: "TRK123456789",
          courier: "FedEx",
          address: "123 Main St, Apt 4B",
          city: "New York, NY 10001",
          status: "delivered",
          estimatedDelivery: "2024-01-20",
        },
        {
          id: "DEL-002",
          orderId: "ORD-002",
          trackingNo: "TRK987654321",
          courier: "UPS",
          address: "456 Oak Ave",
          city: "Los Angeles, CA 90210",
          status: "in_transit",
          estimatedDelivery: "2024-01-22",
        },
        {
          id: "DEL-003",
          orderId: "ORD-003",
          trackingNo: "TRK456789123",
          courier: "DHL",
          address: "789 Pine Rd",
          city: "Chicago, IL 60601",
          status: "shipped",
          estimatedDelivery: "2024-01-23",
        },
        {
          id: "DEL-004",
          orderId: "ORD-004",
          trackingNo: "TRK321654987",
          courier: "USPS",
          address: "321 Elm St",
          city: "Houston, TX 77001",
          status: "pending",
          estimatedDelivery: "2024-01-25",
        },
        {
          id: "DEL-005",
          orderId: "ORD-005",
          trackingNo: "TRK654321789",
          courier: "FedEx",
          address: "654 Maple Dr",
          city: "Phoenix, AZ 85001",
          status: "failed",
          estimatedDelivery: "2024-01-21",
        },
      ]

      setDeliveries(mockDeliveries)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deliveries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDeliveries = () => {
    let filtered = deliveries

    if (searchTerm) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.trackingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.courier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          delivery.city.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredDeliveries(filtered)
  }

  const updateDeliveryStatus = async (deliveryId: string, newStatus: Delivery["status"]) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setDeliveries((prev) =>
        prev.map((delivery) => (delivery.id === deliveryId ? { ...delivery, status: newStatus } : delivery)),
      )

      toast({
        title: "Success",
        description: `Delivery ${deliveryId} status updated to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "in_transit":
        return "secondary"
      case "shipped":
        return "outline"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <MapPin className="h-4 w-4" />
      case "in_transit":
        return <Truck className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Delivery</h1>
            <p className="text-gray-600">Track and manage order deliveries</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{deliveries.filter((d) => d.status === "pending").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold">{deliveries.filter((d) => d.status === "in_transit").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold">{deliveries.filter((d) => d.status === "delivered").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold">{deliveries.filter((d) => d.status === "failed").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order ID, tracking number, courier, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Deliveries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deliveries ({filteredDeliveries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Tracking No.</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.orderId}</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 h-auto font-mono text-sm">
                          {delivery.trackingNo}
                        </Button>
                      </TableCell>
                      <TableCell>{delivery.courier}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{delivery.address}</div>
                          <div className="text-sm text-gray-500">{delivery.city}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(delivery.estimatedDelivery).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(delivery.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(delivery.status)}
                          {delivery.status.replace("_", " ").charAt(0).toUpperCase() +
                            delivery.status.replace("_", " ").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={delivery.status}
                          onValueChange={(value: Delivery["status"]) => updateDeliveryStatus(delivery.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No deliveries found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
