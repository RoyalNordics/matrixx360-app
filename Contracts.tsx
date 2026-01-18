import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileCheck, Plus, Clock, CheckCircle, AlertCircle, XCircle, Building2, Calendar, Eye, FileText, DollarSign } from "lucide-react";
import type { Contract, Customer, Proposal } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  pending_signature: { label: "Pending Signature", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle },
  suspended: { label: "Suspended", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600", icon: Clock },
  terminated: { label: "Terminated", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function Contracts() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsCreateOpen(false);
      toast({ title: "Contract created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating contract", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/contracts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating contract", description: error.message, variant: "destructive" });
    },
  });

  const filteredContracts = contracts.filter((contract) => {
    if (statusFilter !== "all" && contract.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const customer = customers.find(c => c.id === contract.customerId);
      return (
        contract.contractNumber.toLowerCase().includes(search) ||
        contract.title.toLowerCase().includes(search) ||
        customer?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getProposalNumber = (proposalId: string | null) => {
    if (!proposalId) return null;
    return proposals.find(p => p.id === proposalId)?.proposalNumber;
  };

  const activeCount = contracts.filter(c => c.status === "active").length;
  const pendingCount = contracts.filter(c => c.status === "pending_signature").length;
  const totalValue = contracts
    .filter(c => c.status === "active")
    .reduce((sum, c) => sum + parseFloat(c.totalValue || "0"), 0);

  const handleCreateContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createContractMutation.mutate({
      customerId: formData.get("customerId"),
      proposalId: formData.get("proposalId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      totalValue: formData.get("totalValue") || "0",
      paymentTermsDays: parseInt(formData.get("paymentTermsDays") as string) || 30,
    });
  };

  return (
    <Layout title="Contracts" subtitle="Manage customer contracts and agreements">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{contracts.length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-muted-foreground" />
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
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Signature</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Value</p>
                  <p className="text-2xl font-bold">{totalValue.toLocaleString()} DKK</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
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
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-contracts"
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
                  <Button data-testid="button-create-contract">
                    <Plus className="h-4 w-4 mr-2" />
                    New Contract
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Contract</DialogTitle>
                    <DialogDescription>Create a new contract from a proposal or manually</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateContract} className="space-y-4">
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
                      <Label>From Proposal (optional)</Label>
                      <Select name="proposalId">
                        <SelectTrigger data-testid="select-proposal">
                          <SelectValue placeholder="Link to proposal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {proposals.filter(p => p.status === "accepted").map((proposal) => (
                            <SelectItem key={proposal.id} value={proposal.id}>
                              {proposal.proposalNumber} - {proposal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Contract Title *</Label>
                      <Input
                        name="title"
                        placeholder="e.g., Annual Maintenance Agreement 2024"
                        required
                        data-testid="input-contract-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        placeholder="Contract description and terms..."
                        data-testid="input-contract-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          name="startDate"
                          type="date"
                          data-testid="input-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          name="endDate"
                          type="date"
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total Value (DKK)</Label>
                        <Input
                          name="totalValue"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-total-value"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Terms (days)</Label>
                        <Input
                          name="paymentTermsDays"
                          type="number"
                          defaultValue={30}
                          min={1}
                          data-testid="input-payment-terms"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createContractMutation.isPending} data-testid="button-submit-contract">
                        {createContractMutation.isPending ? "Creating..." : "Create Contract"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading contracts...</p>
              </CardContent>
            </Card>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No contracts found</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-contract">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first contract
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map((contract) => {
              const status = statusConfig[contract.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              const isExpiringSoon = contract.endDate && 
                new Date(contract.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
                new Date(contract.endDate) > new Date() &&
                contract.status === "active";
              
              return (
                <Card key={contract.id} className={`hover:shadow-md transition-shadow ${isExpiringSoon ? 'border-yellow-300' : ''}`} data-testid={`card-contract-${contract.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">{contract.contractNumber}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {getProposalNumber(contract.proposalId) && (
                            <Badge variant="outline" className="text-xs">
                              {getProposalNumber(contract.proposalId)}
                            </Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{contract.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {getCustomerName(contract.customerId)}
                          </div>
                          {contract.startDate && contract.endDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(contract.startDate), "dd MMM yyyy")} - {format(new Date(contract.endDate), "dd MMM yyyy")}
                            </div>
                          )}
                        </div>
                        
                        {contract.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{contract.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold">{parseFloat(contract.totalValue || "0").toLocaleString()} {contract.currency}</p>
                        <p className="text-sm text-muted-foreground">Payment: {contract.paymentTermsDays} days</p>
                        <div className="flex gap-2 mt-2 justify-end">
                          {contract.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "pending_signature" })}
                              data-testid={`button-send-${contract.id}`}
                            >
                              Send for Signature
                            </Button>
                          )}
                          {contract.status === "pending_signature" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                              onClick={() => updateStatusMutation.mutate({ id: contract.id, status: "active" })}
                              data-testid={`button-activate-${contract.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-${contract.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
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
