import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface Rfq {
  id: string;
  rfqNumber: string;
  title: string;
  customerId?: string;
  locationId?: string;
  salesCaseId?: string;
  categoryId?: string;
  description?: string;
  status: string;
  deadline?: string;
  sentAt?: string;
  closedAt?: string;
  awardedSupplierId?: string;
  awardReason?: string;
  priceWeight: number;
  qualityWeight: number;
  deliveryWeight: number;
  complianceWeight: number;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  customerId: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface SalesCase {
  id: string;
  caseNumber: string;
  title: string;
}

const RFQ_STATUSES = [
  { id: "draft", label: "Draft", color: "bg-slate-500" },
  { id: "sent", label: "Sent", color: "bg-blue-500" },
  { id: "receiving_quotes", label: "Receiving Quotes", color: "bg-purple-500" },
  { id: "evaluating", label: "Evaluating", color: "bg-amber-500" },
  { id: "awarded", label: "Awarded", color: "bg-green-500" },
  { id: "cancelled", label: "Cancelled", color: "bg-red-500" },
];

export default function Procurement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newRfq, setNewRfq] = useState({
    title: "",
    description: "",
    customerId: "",
    locationId: "",
    categoryId: "",
    salesCaseId: "",
    deadline: "",
    priceWeight: 40,
    qualityWeight: 30,
    deliveryWeight: 15,
    complianceWeight: 15,
  });

  const { data: rfqs = [], isLoading } = useQuery<Rfq[]>({
    queryKey: ["/api/rfqs"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const { data: salesCases = [] } = useQuery<SalesCase[]>({
    queryKey: ["/api/sales-cases"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newRfq) =>
      apiRequest("POST", "/api/rfqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      setIsCreateDialogOpen(false);
      setNewRfq({
        title: "",
        description: "",
        customerId: "",
        locationId: "",
        categoryId: "",
        salesCaseId: "",
        deadline: "",
        priceWeight: 40,
        qualityWeight: 30,
        deliveryWeight: 15,
        complianceWeight: 15,
      });
      toast({ title: "RFQ created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create RFQ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/rfqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({ title: "RFQ deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete RFQ", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = RFQ_STATUSES.find(s => s.id === status);
    return (
      <Badge className={`${statusConfig?.color || "bg-gray-500"} text-white`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return "-";
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || "-";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "-";
  };

  const filteredRfqs = statusFilter === "all" 
    ? rfqs 
    : rfqs.filter(r => r.status === statusFilter);

  const stats = {
    draft: rfqs.filter(r => r.status === "draft").length,
    active: rfqs.filter(r => ["sent", "receiving_quotes", "evaluating"].includes(r.status)).length,
    awarded: rfqs.filter(r => r.status === "awarded").length,
    total: rfqs.length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Procurement</h1>
            <p className="text-muted-foreground">Manage RFQs and vendor tenders</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-rfq">
            <Plus className="h-4 w-4 mr-2" />
            New RFQ
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft RFQs</CardTitle>
              <FileText className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-draft">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">Pending submission</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active RFQs</CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Awaiting quotes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awarded</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-awarded">{stats.awarded}</div>
              <p className="text-xs text-muted-foreground">Completed tenders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All ({rfqs.length})</TabsTrigger>
            <TabsTrigger value="draft" data-testid="tab-draft">Draft ({stats.draft})</TabsTrigger>
            <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
            <TabsTrigger value="evaluating" data-testid="tab-evaluating">Evaluating</TabsTrigger>
            <TabsTrigger value="awarded" data-testid="tab-awarded">Awarded ({stats.awarded})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading RFQs...</div>
            ) : filteredRfqs.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No RFQs found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === "all" 
                    ? "Create your first RFQ to start the procurement process."
                    : `No RFQs with status "${statusFilter}" found.`}
                </p>
                {statusFilter === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-empty-create-rfq">
                    <Plus className="h-4 w-4 mr-2" />
                    Create RFQ
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRfqs.map((rfq) => (
                    <TableRow 
                      key={rfq.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/procurement/${rfq.id}`)}
                      data-testid={`row-rfq-${rfq.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-rfq-number-${rfq.id}`}>
                        {rfq.rfqNumber}
                      </TableCell>
                      <TableCell data-testid={`text-rfq-title-${rfq.id}`}>{rfq.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {getCustomerName(rfq.customerId)}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(rfq.categoryId)}</TableCell>
                      <TableCell>{getStatusBadge(rfq.status)}</TableCell>
                      <TableCell>
                        {rfq.deadline ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(rfq.deadline), "MMM d, yyyy")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(rfq.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/procurement/${rfq.id}`);
                            }}
                            data-testid={`button-view-rfq-${rfq.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this RFQ?")) {
                                deleteMutation.mutate(rfq.id);
                              }
                            }}
                            data-testid={`button-delete-rfq-${rfq.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New RFQ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newRfq.title}
                onChange={(e) => setNewRfq({ ...newRfq, title: e.target.value })}
                placeholder="e.g., HVAC Maintenance Services for Building A"
                data-testid="input-rfq-title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRfq.description}
                onChange={(e) => setNewRfq({ ...newRfq, description: e.target.value })}
                placeholder="Detailed description of the services required..."
                rows={3}
                data-testid="input-rfq-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  value={newRfq.customerId}
                  onValueChange={(v) => setNewRfq({ ...newRfq, customerId: v })}
                >
                  <SelectTrigger data-testid="select-rfq-customer">
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

              <div className="grid gap-2">
                <Label htmlFor="categoryId">Service Category</Label>
                <Select
                  value={newRfq.categoryId}
                  onValueChange={(v) => setNewRfq({ ...newRfq, categoryId: v })}
                >
                  <SelectTrigger data-testid="select-rfq-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salesCaseId">Link to Sales Case (optional)</Label>
                <Select
                  value={newRfq.salesCaseId}
                  onValueChange={(v) => setNewRfq({ ...newRfq, salesCaseId: v })}
                >
                  <SelectTrigger data-testid="select-rfq-sales-case">
                    <SelectValue placeholder="Select sales case" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesCases.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id}>
                        {sc.caseNumber} - {sc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Quote Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newRfq.deadline}
                  onChange={(e) => setNewRfq({ ...newRfq, deadline: e.target.value })}
                  data-testid="input-rfq-deadline"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Evaluation Weights (must total 100%)</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priceWeight">Price (%)</Label>
                  <Input
                    id="priceWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={newRfq.priceWeight}
                    onChange={(e) => setNewRfq({ ...newRfq, priceWeight: parseInt(e.target.value) || 0 })}
                    data-testid="input-price-weight"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qualityWeight">Quality (%)</Label>
                  <Input
                    id="qualityWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={newRfq.qualityWeight}
                    onChange={(e) => setNewRfq({ ...newRfq, qualityWeight: parseInt(e.target.value) || 0 })}
                    data-testid="input-quality-weight"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deliveryWeight">Delivery (%)</Label>
                  <Input
                    id="deliveryWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={newRfq.deliveryWeight}
                    onChange={(e) => setNewRfq({ ...newRfq, deliveryWeight: parseInt(e.target.value) || 0 })}
                    data-testid="input-delivery-weight"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="complianceWeight">Compliance (%)</Label>
                  <Input
                    id="complianceWeight"
                    type="number"
                    min="0"
                    max="100"
                    value={newRfq.complianceWeight}
                    onChange={(e) => setNewRfq({ ...newRfq, complianceWeight: parseInt(e.target.value) || 0 })}
                    data-testid="input-compliance-weight"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: {newRfq.priceWeight + newRfq.qualityWeight + newRfq.deliveryWeight + newRfq.complianceWeight}%
                {newRfq.priceWeight + newRfq.qualityWeight + newRfq.deliveryWeight + newRfq.complianceWeight !== 100 && (
                  <span className="text-destructive ml-2">(Should equal 100%)</span>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-rfq">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newRfq)}
              disabled={!newRfq.title || createMutation.isPending}
              data-testid="button-submit-rfq"
            >
              {createMutation.isPending ? "Creating..." : "Create RFQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
