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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Plus, Send, CheckCircle, XCircle, Clock, DollarSign, Building2, Calendar, Eye } from "lucide-react";
import type { Proposal, Customer, SalesCase } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600", icon: Clock },
};

export default function Proposals() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: salesCases = [] } = useQuery<SalesCase[]>({
    queryKey: ["/api/sales-cases"],
  });

  const createProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/proposals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      setIsCreateOpen(false);
      toast({ title: "Proposal created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating proposal", description: error.message, variant: "destructive" });
    },
  });

  const filteredProposals = proposals.filter((proposal) => {
    if (statusFilter !== "all" && proposal.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const customer = customers.find(c => c.id === proposal.customerId);
      return (
        proposal.proposalNumber.toLowerCase().includes(search) ||
        proposal.title.toLowerCase().includes(search) ||
        customer?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getSalesCaseNumber = (salesCaseId: string | null) => {
    if (!salesCaseId) return null;
    return salesCases.find(sc => sc.id === salesCaseId)?.caseNumber;
  };

  const totalValue = proposals.reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
  const pendingValue = proposals
    .filter(p => ["draft", "sent", "under_review"].includes(p.status))
    .reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);
  const wonValue = proposals
    .filter(p => p.status === "accepted")
    .reduce((sum, p) => sum + parseFloat(p.totalAmount || "0"), 0);

  const handleCreateProposal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProposalMutation.mutate({
      customerId: formData.get("customerId"),
      salesCaseId: formData.get("salesCaseId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      contractDurationMonths: parseInt(formData.get("contractDurationMonths") as string) || 12,
      paymentTermsDays: parseInt(formData.get("paymentTermsDays") as string) || 30,
    });
  };

  return (
    <Layout title="Proposals" subtitle="Create and manage customer proposals">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Proposals</p>
                  <p className="text-2xl font-bold">{proposals.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{totalValue.toLocaleString()} DKK</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingValue.toLocaleString()} DKK</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Won</p>
                  <p className="text-2xl font-bold">{wonValue.toLocaleString()} DKK</p>
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
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-proposals"
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
                  <Button data-testid="button-create-proposal">
                    <Plus className="h-4 w-4 mr-2" />
                    New Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>Create a proposal for a customer</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProposal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerId">Customer *</Label>
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
                      <Label htmlFor="salesCaseId">Link to Sales Case (optional)</Label>
                      <Select name="salesCaseId">
                        <SelectTrigger data-testid="select-sales-case">
                          <SelectValue placeholder="Select sales case" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {salesCases.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id}>
                              {sc.caseNumber} - {sc.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Proposal Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Annual Maintenance Contract"
                        required
                        data-testid="input-proposal-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Proposal description..."
                        data-testid="input-proposal-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contractDurationMonths">Contract Duration (months)</Label>
                        <Input
                          id="contractDurationMonths"
                          name="contractDurationMonths"
                          type="number"
                          defaultValue={12}
                          min={1}
                          data-testid="input-contract-duration"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentTermsDays">Payment Terms (days)</Label>
                        <Input
                          id="paymentTermsDays"
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
                      <Button type="submit" disabled={createProposalMutation.isPending} data-testid="button-submit-proposal">
                        {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading proposals...</p>
              </CardContent>
            </Card>
          ) : filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No proposals found</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-proposal">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first proposal
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => {
              const status = statusConfig[proposal.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              
              return (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow" data-testid={`card-proposal-${proposal.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">{proposal.proposalNumber}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {getSalesCaseNumber(proposal.salesCaseId) && (
                            <Badge variant="outline" className="text-xs">
                              {getSalesCaseNumber(proposal.salesCaseId)}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {getCustomerName(proposal.customerId)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(proposal.createdAt), "dd MMM yyyy")}
                          </div>
                          {proposal.validUntil && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Valid until {format(new Date(proposal.validUntil), "dd MMM yyyy")}
                            </div>
                          )}
                        </div>
                        
                        {proposal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold">{parseFloat(proposal.totalAmount || "0").toLocaleString()} {proposal.currency}</p>
                        <p className="text-sm text-muted-foreground">{proposal.contractDurationMonths} months</p>
                        <Link href={`/proposals/${proposal.id}`}>
                          <Button variant="outline" size="sm" className="mt-2" data-testid={`button-view-proposal-${proposal.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
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
