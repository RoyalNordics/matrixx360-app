import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Wrench, Plus, Clock, CheckCircle, AlertTriangle, XCircle, Building2, MapPin, Calendar, User, Eye, Play, Pause } from "lucide-react";
import type { WorkOrder, Customer, Location, Supplier } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Play },
  on_hold: { label: "On Hold", color: "bg-orange-100 text-orange-800", icon: Pause },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
};

const workTypeConfig: Record<string, string> = {
  preventive: "Preventive Maintenance",
  reactive: "Reactive Maintenance",
  inspection: "Inspection",
  emergency: "Emergency",
  project: "Project Work",
};

export default function WorkOrders() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/work-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setIsCreateOpen(false);
      toast({ title: "Work order created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating work order", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/work-orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: "Work order status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating work order", description: error.message, variant: "destructive" });
    },
  });

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (statusFilter !== "all" && wo.status !== statusFilter) return false;
    if (priorityFilter !== "all" && wo.priority !== priorityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const location = locations.find(l => l.id === wo.locationId);
      return (
        wo.workOrderNumber.toLowerCase().includes(search) ||
        wo.title.toLowerCase().includes(search) ||
        location?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || "Unknown";
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    return suppliers.find(s => s.id === supplierId)?.name;
  };

  const openCount = workOrders.filter(wo => wo.status === "open").length;
  const inProgressCount = workOrders.filter(wo => wo.status === "in_progress").length;
  const overdueCount = workOrders.filter(wo => 
    wo.scheduledDate && new Date(wo.scheduledDate) < new Date() && !["completed", "cancelled"].includes(wo.status)
  ).length;

  const handleCreateWorkOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createWorkOrderMutation.mutate({
      customerId: formData.get("customerId"),
      locationId: formData.get("locationId"),
      supplierId: formData.get("supplierId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      workType: formData.get("workType"),
      priority: formData.get("priority"),
      scheduledDate: formData.get("scheduledDate") || null,
      estimatedDurationMinutes: parseFloat(formData.get("estimatedHours") as string) ? Math.round(parseFloat(formData.get("estimatedHours") as string) * 60) : null,
    });
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const filteredLocations = locations.filter(l => !selectedCustomerId || l.customerId === selectedCustomerId);

  return (
    <Layout title="Work Orders" subtitle="Manage maintenance and service work orders">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Work Orders</p>
                  <p className="text-2xl font-bold">{workOrders.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{openCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                </div>
                <Play className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{overdueCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-wrap flex-1">
                <Input
                  placeholder="Search work orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-work-orders"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-priority-filter">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-work-order">
                    <Plus className="h-4 w-4 mr-2" />
                    New Work Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Work Order</DialogTitle>
                    <DialogDescription>Create a new maintenance or service work order</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateWorkOrder} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Customer *</Label>
                        <Select 
                          name="customerId" 
                          required
                          onValueChange={(value) => setSelectedCustomerId(value)}
                        >
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Location *</Label>
                        <Select name="locationId" required>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredLocations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        name="title"
                        placeholder="e.g., HVAC Filter Replacement"
                        required
                        data-testid="input-work-order-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        placeholder="Work order details..."
                        data-testid="input-work-order-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Work Type *</Label>
                        <Select name="workType" defaultValue="preventive">
                          <SelectTrigger data-testid="select-work-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(workTypeConfig).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority *</Label>
                        <Select name="priority" defaultValue="medium">
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(priorityConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assigned Supplier</Label>
                        <Select name="supplierId">
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Scheduled Date</Label>
                        <Input
                          name="scheduledDate"
                          type="date"
                          data-testid="input-scheduled-date"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estimated Hours</Label>
                      <Input
                        name="estimatedHours"
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="e.g., 2.5"
                        data-testid="input-estimated-hours"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createWorkOrderMutation.isPending} data-testid="button-submit-work-order">
                        {createWorkOrderMutation.isPending ? "Creating..." : "Create Work Order"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading work orders...</p>
              </CardContent>
            </Card>
          ) : filteredWorkOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No work orders found</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-work-order">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first work order
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredWorkOrders.map((wo) => {
              const status = statusConfig[wo.status] || statusConfig.open;
              const priority = priorityConfig[wo.priority] || priorityConfig.medium;
              const StatusIcon = status.icon;
              const isOverdue = wo.scheduledDate && new Date(wo.scheduledDate) < new Date() && !["completed", "cancelled"].includes(wo.status);
              
              return (
                <Card key={wo.id} className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`} data-testid={`card-work-order-${wo.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">{wo.workOrderNumber}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className={priority.color}>{priority.label}</Badge>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{wo.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {getCustomerName(wo.customerId)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {getLocationName(wo.locationId)}
                          </div>
                          <Badge variant="outline">{workTypeConfig[wo.workType]}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {format(new Date(wo.createdAt), "dd MMM yyyy")}
                          </div>
                          {wo.scheduledDate && (
                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                              <Clock className="h-4 w-4" />
                              Scheduled {format(new Date(wo.scheduledDate), "dd MMM yyyy")}
                            </div>
                          )}
                          {getSupplierName(wo.supplierId) && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {getSupplierName(wo.supplierId)}
                            </div>
                          )}
                        </div>
                        
                        {wo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{wo.description}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {wo.status === "open" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "in_progress" })}
                            data-testid={`button-start-${wo.id}`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {wo.status === "in_progress" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700"
                            onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "completed" })}
                            data-testid={`button-complete-${wo.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Link href={`/work-orders/${wo.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${wo.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
