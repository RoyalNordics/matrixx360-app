import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Building2,
  Calendar,
  User,
  MoreVertical,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SalesCase {
  id: string;
  caseNumber: string;
  title: string;
  customerId?: string;
  status: string;
  estimatedValue?: string;
  probability: number;
  expectedCloseDate?: string;
  ownerUserId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface PipelineStats {
  leadCount: number;
  discoveryCount: number;
  proposalCount: number;
  negotiationCount: number;
  wonCount: number;
  lostCount: number;
  totalValue: number;
  weightedValue: number;
}

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "bg-slate-500", probability: 10 },
  { id: "discovery", label: "Discovery", color: "bg-blue-500", probability: 30 },
  { id: "proposal", label: "Proposal", color: "bg-purple-500", probability: 50 },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500", probability: 70 },
  { id: "won", label: "Won", color: "bg-green-500", probability: 100 },
  { id: "lost", label: "Lost", color: "bg-red-500", probability: 0 },
];

export default function SalesPipeline() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    customerId: "",
    estimatedValue: "",
    expectedCloseDate: "",
    description: "",
  });

  const { data: salesCases = [], isLoading } = useQuery<SalesCase[]>({
    queryKey: ["/api/sales-cases"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: pipelineStats } = useQuery<PipelineStats>({
    queryKey: ["/api/sales/pipeline-stats"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newCase) =>
      apiRequest("POST", "/api/sales-cases", {
        ...data,
        status: "lead",
        probability: 10,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pipeline-stats"] });
      setIsCreateDialogOpen(false);
      setNewCase({ title: "", customerId: "", estimatedValue: "", expectedCloseDate: "", description: "" });
      toast({ title: "Sales case created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create sales case", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, probability }: { id: string; status: string; probability: number }) =>
      apiRequest("PUT", `/api/sales-cases/${id}`, { status, probability }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-cases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/pipeline-stats"] });
      toast({ title: "Sales case updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update sales case", description: error.message, variant: "destructive" });
    },
  });

  const getCasesByStatus = (status: string) => {
    return salesCases.filter((c) => c.status === status);
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return "No customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Unknown";
  };

  const formatCurrency = (value: string | undefined) => {
    if (!value) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(num);
  };

  const handleCreateCase = () => {
    if (!newCase.title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    createMutation.mutate(newCase);
  };

  const handleMoveToStage = (caseId: string, stage: typeof PIPELINE_STAGES[0]) => {
    updateStatusMutation.mutate({
      id: caseId,
      status: stage.id,
      probability: stage.probability,
    });
  };

  const getNextStage = (currentStatus: string) => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStatus);
    if (currentIndex === -1 || currentIndex >= PIPELINE_STAGES.length - 2) return null;
    return PIPELINE_STAGES[currentIndex + 1];
  };

  if (isLoading) {
    return (
      <Layout title="Sales Pipeline" subtitle="Loading...">
        <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
          <p className="text-muted-foreground">Loading sales pipeline...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Sales Pipeline"
      subtitle={`${salesCases.length} active opportunities`}
      actions={
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-sales-case-button">
          <Plus className="w-4 h-4 mr-2" />
          New Sales Case
        </Button>
      }
    >
      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6" data-testid="pipeline-stats">
        <Card data-testid="stat-pipeline-value">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(pipelineStats?.totalValue?.toString())}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-weighted-value">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold">{formatCurrency(pipelineStats?.weightedValue?.toString())}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-won-count">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Won This Period</p>
                <p className="text-2xl font-bold text-green-600">{pipelineStats?.wonCount || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-active-opportunities">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
                <p className="text-2xl font-bold">
                  {(pipelineStats?.leadCount || 0) + 
                   (pipelineStats?.discoveryCount || 0) + 
                   (pipelineStats?.proposalCount || 0) + 
                   (pipelineStats?.negotiationCount || 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 320px)" }} data-testid="kanban-board">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80" data-testid={`kanban-column-${stage.id}`}>
            <div className="bg-muted/50 rounded-lg p-3">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-medium">{stage.label}</h3>
                  <Badge variant="secondary" className="ml-1">
                    {getCasesByStatus(stage.id).length}
                  </Badge>
                </div>
                {stage.id !== "won" && stage.id !== "lost" && (
                  <span className="text-xs text-muted-foreground">{stage.probability}%</span>
                )}
              </div>

              {/* Cards */}
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3 pr-2">
                  {getCasesByStatus(stage.id).map((salesCase) => {
                    const nextStage = getNextStage(salesCase.status);
                    
                    return (
                      <Card
                        key={salesCase.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/sales/${salesCase.id}`)}
                        data-testid={`sales-case-card-${salesCase.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{salesCase.caseNumber}</p>
                              <h4 className="font-medium text-sm truncate">{salesCase.title}</h4>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {PIPELINE_STAGES.filter((s) => s.id !== salesCase.status).map((s) => (
                                  <DropdownMenuItem
                                    key={s.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToStage(salesCase.id, s);
                                    }}
                                  >
                                    Move to {s.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{getCustomerName(salesCase.customerId)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              {formatCurrency(salesCase.estimatedValue)}
                            </span>
                            {salesCase.expectedCloseDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(salesCase.expectedCloseDate), "MMM d")}
                              </div>
                            )}
                          </div>

                          {nextStage && stage.id !== "won" && stage.id !== "lost" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToStage(salesCase.id, nextStage);
                              }}
                              data-testid={`move-to-${nextStage.id}-${salesCase.id}`}
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Move to {nextStage.label}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {getCasesByStatus(stage.id).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No cases in {stage.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ))}
      </div>

      {/* Create Sales Case Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Sales Case</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newCase.title}
                onChange={(e) => setNewCase((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., HVAC Maintenance Contract"
                data-testid="input-sales-case-title"
              />
            </div>

            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={newCase.customerId}
                onValueChange={(value) => setNewCase((prev) => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select a customer" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedValue">Estimated Value (DKK)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  value={newCase.estimatedValue}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, estimatedValue: e.target.value }))}
                  placeholder="100000"
                  data-testid="input-estimated-value"
                />
              </div>
              <div>
                <Label htmlFor="expectedCloseDate">Expected Close</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={newCase.expectedCloseDate}
                  onChange={(e) => setNewCase((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                  data-testid="input-expected-close-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCase.description}
                onChange={(e) => setNewCase((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the opportunity..."
                rows={3}
                data-testid="input-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCase} disabled={createMutation.isPending} data-testid="submit-sales-case">
              {createMutation.isPending ? "Creating..." : "Create Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
