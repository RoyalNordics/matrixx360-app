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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowRightLeft, Plus, Clock, CheckCircle, AlertCircle, PlayCircle, Pause, Building2, Calendar, Eye, FileText } from "lucide-react";
import type { Transition, TransitionTask, Customer, Contract } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  planning: { label: "Planning", color: "bg-gray-100 text-gray-800", icon: FileText },
  pending_start: { label: "Pending Start", color: "bg-blue-100 text-blue-800", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: PlayCircle },
  on_hold: { label: "On Hold", color: "bg-orange-100 text-orange-800", icon: Pause },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

const transitionTypeConfig: Record<string, string> = {
  new_customer: "New Customer Onboarding",
  contract_renewal: "Contract Renewal",
  scope_change: "Scope Change",
  offboarding: "Customer Offboarding",
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-800" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-800" },
};

export default function Transitions() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transitions = [], isLoading } = useQuery<Transition[]>({
    queryKey: ["/api/transitions"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const createTransitionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/transitions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transitions"] });
      setIsCreateOpen(false);
      toast({ title: "Transition checklist created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating transition", description: error.message, variant: "destructive" });
    },
  });

  const filteredTransitions = transitions.filter((transition) => {
    if (statusFilter !== "all" && transition.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const customer = customers.find(c => c.id === transition.customerId);
      return (
        transition.title.toLowerCase().includes(search) ||
        customer?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getContractNumber = (contractId: string | null) => {
    if (!contractId) return null;
    return contracts.find(c => c.id === contractId)?.contractNumber;
  };

  const activeCount = transitions.filter(t => ["in_progress", "pending_start"].includes(t.status)).length;
  const planningCount = transitions.filter(t => t.status === "planning").length;
  const completedCount = transitions.filter(t => t.status === "completed").length;

  const handleCreateTransition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTransitionMutation.mutate({
      customerId: formData.get("customerId"),
      contractId: formData.get("contractId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      plannedStartDate: formData.get("plannedStartDate") || null,
      plannedEndDate: formData.get("plannedEndDate") || null,
    });
  };

  return (
    <Layout title="Transitions" subtitle="Sales-to-Operations handover and onboarding checklists">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transitions</p>
                  <p className="text-2xl font-bold">{transitions.length}</p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planning</p>
                  <p className="text-2xl font-bold">{planningCount}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-4 flex-1">
                <Input
                  placeholder="Search transitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-transitions"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-transition">
                    <Plus className="h-4 w-4 mr-2" />
                    New Transition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Transition Checklist</DialogTitle>
                    <DialogDescription>Start a new sales-to-operations handover process</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTransition} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Customer *</Label>
                      <Select name="customerId" required>
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
                      <Label>Link to Contract (optional)</Label>
                      <Select name="contractId">
                        <SelectTrigger data-testid="select-contract">
                          <SelectValue placeholder="Select contract" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {contracts.map((contract) => (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contract.contractNumber} - {contract.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Transition Title *</Label>
                      <Input
                        name="title"
                        placeholder="e.g., Q1 2024 Onboarding - Acme Corp"
                        required
                        data-testid="input-transition-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        placeholder="Transition details and notes..."
                        data-testid="input-transition-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Planned Start Date</Label>
                        <Input
                          name="plannedStartDate"
                          type="date"
                          data-testid="input-planned-start"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Planned End Date</Label>
                        <Input
                          name="plannedEndDate"
                          type="date"
                          data-testid="input-planned-end"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTransitionMutation.isPending} data-testid="button-submit-transition">
                        {createTransitionMutation.isPending ? "Creating..." : "Create Transition"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Transitions List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading transitions...</p>
              </CardContent>
            </Card>
          ) : filteredTransitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No transitions found</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-transition">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first transition
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTransitions.map((transition) => {
              const status = statusConfig[transition.status] || statusConfig.planning;
              const StatusIcon = status.icon;
              const progressPercent = transition.progressPercent || 0;
              
              return (
                <Card key={transition.id} className="hover:shadow-md transition-shadow" data-testid={`card-transition-${transition.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">{transition.transitionNumber}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {getContractNumber(transition.contractId) && (
                            <Badge variant="outline" className="text-xs">
                              {getContractNumber(transition.contractId)}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{transition.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {getCustomerName(transition.customerId)}
                          </div>
                          {transition.plannedStartDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(transition.plannedStartDate), "dd MMM")} - {transition.plannedEndDate ? format(new Date(transition.plannedEndDate), "dd MMM yyyy") : 'TBD'}
                            </div>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        
                        {transition.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{transition.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
                        <p className="text-sm text-muted-foreground">Complete</p>
                        <Link href={`/transitions/${transition.id}`}>
                          <Button variant="outline" size="sm" className="mt-2" data-testid={`button-view-transition-${transition.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Checklist
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
