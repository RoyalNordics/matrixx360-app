import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Plus, 
  Send, 
  CheckCircle2, 
  Clock,
  BarChart3,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  Trophy,
  X,
  Users,
  FileText,
  DollarSign,
  Star,
  Trash2,
  Calculator,
  Award
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

interface RfqSupplier {
  id: string;
  rfqId: string;
  supplierId: string;
  invitedAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  status: string;
  declineReason?: string;
  createdAt: string;
}

interface RfqQuote {
  id: string;
  rfqId: string;
  supplierId: string;
  totalPrice: string;
  priceBreakdown?: any;
  currency: string;
  deliveryDays?: number;
  slaTerms?: string;
  validityDays: number;
  qualityScore?: string;
  complianceScore?: string;
  esgScore?: string;
  documents?: any;
  notes?: string;
  supplierNotes?: string;
  status: string;
  benchmarkScore?: string;
  priceRank?: number;
  overallRank?: number;
  submittedAt?: string;
  evaluatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rating?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

const RFQ_STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-500" },
  sent: { label: "Sent", color: "bg-blue-500" },
  receiving_quotes: { label: "Receiving Quotes", color: "bg-purple-500" },
  evaluating: { label: "Evaluating", color: "bg-amber-500" },
  awarded: { label: "Awarded", color: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
};

export default function ProcurementDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isAddQuoteDialogOpen, setIsAddQuoteDialogOpen] = useState(false);
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [newQuote, setNewQuote] = useState({
    supplierId: "",
    totalPrice: "",
    deliveryDays: "",
    validityDays: "30",
    qualityScore: "70",
    complianceScore: "70",
    esgScore: "70",
    notes: "",
  });

  const { data: rfq, isLoading } = useQuery<Rfq>({
    queryKey: ["/api/rfqs", id],
  });

  const { data: rfqSuppliers = [] } = useQuery<RfqSupplier[]>({
    queryKey: ["/api/rfqs", id, "suppliers"],
    queryFn: async () => {
      const res = await fetch(`/api/rfqs/${id}/suppliers`);
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: rfqQuotes = [] } = useQuery<RfqQuote[]>({
    queryKey: ["/api/rfqs", id, "quotes"],
    queryFn: async () => {
      const res = await fetch(`/api/rfqs/${id}/quotes`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: allSuppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ["/api/service-categories"],
  });

  const sendRfqMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/rfqs/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id] });
      toast({ title: "RFQ sent to suppliers" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send RFQ", description: error.message, variant: "destructive" });
    },
  });

  const addSupplierMutation = useMutation({
    mutationFn: (supplierId: string) => 
      apiRequest("POST", `/api/rfqs/${id}/suppliers`, { supplierId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id, "suppliers"] });
      setIsAddSupplierDialogOpen(false);
      setSelectedSupplierId("");
      toast({ title: "Supplier invited to RFQ" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to invite supplier", description: error.message, variant: "destructive" });
    },
  });

  const removeSupplierMutation = useMutation({
    mutationFn: (rfqSupplierId: string) => 
      apiRequest("DELETE", `/api/rfq-suppliers/${rfqSupplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id, "suppliers"] });
      toast({ title: "Supplier removed from RFQ" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove supplier", description: error.message, variant: "destructive" });
    },
  });

  const addQuoteMutation = useMutation({
    mutationFn: (data: typeof newQuote) => 
      apiRequest("POST", `/api/rfqs/${id}/quotes`, {
        ...data,
        deliveryDays: parseInt(data.deliveryDays) || null,
        validityDays: parseInt(data.validityDays) || 30,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id, "quotes"] });
      setIsAddQuoteDialogOpen(false);
      setNewQuote({
        supplierId: "",
        totalPrice: "",
        deliveryDays: "",
        validityDays: "30",
        qualityScore: "70",
        complianceScore: "70",
        esgScore: "70",
        notes: "",
      });
      toast({ title: "Quote added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add quote", description: error.message, variant: "destructive" });
    },
  });

  const calculateBenchmarkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/rfqs/${id}/calculate-benchmarks`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id, "quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id] });
      toast({ title: "Benchmark scores calculated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to calculate benchmarks", description: error.message, variant: "destructive" });
    },
  });

  const awardMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", `/api/rfqs/${id}/award`, { 
        supplierId: selectedSupplierId, 
        reason: awardReason 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs", id, "quotes"] });
      setIsAwardDialogOpen(false);
      toast({ title: "RFQ awarded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to award RFQ", description: error.message, variant: "destructive" });
    },
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = allSuppliers.find(s => s.id === supplierId);
    return supplier?.name || "Unknown Supplier";
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

  const availableSuppliers = allSuppliers.filter(
    s => !rfqSuppliers.some(rs => rs.supplierId === s.id)
  );

  const suppliersWithQuotes = rfqSuppliers.filter(
    rs => !rfqQuotes.some(q => q.supplierId === rs.supplierId)
  );

  if (isLoading || !rfq) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Loading RFQ...</div>
      </Layout>
    );
  }

  const statusConfig = RFQ_STATUSES[rfq.status] || { label: rfq.status, color: "bg-gray-500" };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/procurement")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" data-testid="text-rfq-number">{rfq.rfqNumber}</h1>
              <Badge className={`${statusConfig.color} text-white`} data-testid="badge-status">
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground" data-testid="text-rfq-title">{rfq.title}</p>
          </div>
          <div className="flex gap-2">
            {rfq.status === "draft" && rfqSuppliers.length >= 3 && (
              <Button 
                onClick={() => sendRfqMutation.mutate()}
                disabled={sendRfqMutation.isPending}
                data-testid="button-send-rfq"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Suppliers
              </Button>
            )}
            {rfqQuotes.length >= 2 && rfq.status !== "awarded" && (
              <Button 
                variant="outline"
                onClick={() => calculateBenchmarkMutation.mutate()}
                disabled={calculateBenchmarkMutation.isPending}
                data-testid="button-calculate-benchmark"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Benchmarks
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-customer">{getCustomerName(rfq.customerId)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Category</CardTitle>
            </CardHeader>
            <CardContent>
              <span data-testid="text-category">{getCategoryName(rfq.categoryId)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-deadline">
                  {rfq.deadline ? format(new Date(rfq.deadline), "PPP") : "Not set"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {rfq.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" data-testid="text-description">{rfq.description}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Weights</CardTitle>
            <CardDescription>How quotes will be scored</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Price</span>
                  <span className="font-medium">{rfq.priceWeight}%</span>
                </div>
                <Progress value={rfq.priceWeight} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Quality</span>
                  <span className="font-medium">{rfq.qualityWeight}%</span>
                </div>
                <Progress value={rfq.qualityWeight} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Delivery</span>
                  <span className="font-medium">{rfq.deliveryWeight}%</span>
                </div>
                <Progress value={rfq.deliveryWeight} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Compliance</span>
                  <span className="font-medium">{rfq.complianceWeight}%</span>
                </div>
                <Progress value={rfq.complianceWeight} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">
              <Users className="h-4 w-4 mr-2" />
              Invited Suppliers ({rfqSuppliers.length})
            </TabsTrigger>
            <TabsTrigger value="quotes" data-testid="tab-quotes">
              <FileText className="h-4 w-4 mr-2" />
              Quotes ({rfqQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="benchmark" data-testid="tab-benchmark">
              <BarChart3 className="h-4 w-4 mr-2" />
              Benchmark Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Invited Suppliers</CardTitle>
                  <CardDescription>
                    Minimum 3 suppliers required to send RFQ
                    {rfqSuppliers.length < 3 && (
                      <span className="text-destructive ml-2">
                        ({3 - rfqSuppliers.length} more needed)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAddSupplierDialogOpen(true)}
                  disabled={rfq.status !== "draft"}
                  data-testid="button-add-supplier"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </CardHeader>
              <CardContent>
                {rfqSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suppliers invited yet</p>
                    <p className="text-sm">Add at least 3 suppliers to send this RFQ</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Invited</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqSuppliers.map((rs) => (
                        <TableRow key={rs.id} data-testid={`row-supplier-${rs.id}`}>
                          <TableCell className="font-medium">
                            {getSupplierName(rs.supplierId)}
                          </TableCell>
                          <TableCell>
                            {rs.invitedAt ? format(new Date(rs.invitedAt), "PP") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              rs.status === "quoted" ? "default" :
                              rs.status === "declined" ? "destructive" :
                              "secondary"
                            }>
                              {rs.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSupplierMutation.mutate(rs.id)}
                              disabled={rfq.status !== "draft"}
                              data-testid={`button-remove-supplier-${rs.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Received Quotes</CardTitle>
                  <CardDescription>Quotes submitted by invited suppliers</CardDescription>
                </div>
                <Button 
                  onClick={() => setIsAddQuoteDialogOpen(true)}
                  disabled={suppliersWithQuotes.length === 0}
                  data-testid="button-add-quote"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quote
                </Button>
              </CardHeader>
              <CardContent>
                {rfqQuotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No quotes received yet</p>
                    <p className="text-sm">Quotes will appear here once suppliers respond</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Total Price</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Benchmark</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqQuotes.map((quote) => (
                        <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                          <TableCell>
                            {quote.overallRank === 1 ? (
                              <div className="flex items-center gap-1">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                <span className="font-bold">1st</span>
                              </div>
                            ) : quote.overallRank ? (
                              `#${quote.overallRank}`
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {getSupplierName(quote.supplierId)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {parseFloat(quote.totalPrice).toLocaleString()} {quote.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            {quote.deliveryDays ? `${quote.deliveryDays} days` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              {quote.qualityScore || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {quote.benchmarkScore ? (
                              <Badge variant="outline">
                                {parseFloat(quote.benchmarkScore).toFixed(1)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              quote.status === "accepted" ? "default" :
                              quote.status === "rejected" ? "destructive" :
                              "secondary"
                            }>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {rfq.status !== "awarded" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSupplierId(quote.supplierId);
                                  setIsAwardDialogOpen(true);
                                }}
                                data-testid={`button-award-${quote.id}`}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                Award
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmark">
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Analysis</CardTitle>
                <CardDescription>
                  Weighted comparison of all received quotes based on evaluation criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rfqQuotes.length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>At least 2 quotes required for benchmark analysis</p>
                    <p className="text-sm">Collect more quotes to compare suppliers</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rfqQuotes
                      .filter(q => q.benchmarkScore)
                      .sort((a, b) => (a.overallRank || 999) - (b.overallRank || 999))
                      .map((quote, index) => {
                        const score = parseFloat(quote.benchmarkScore || "0");
                        const isWinner = index === 0;
                        return (
                          <div key={quote.id} className={`p-4 rounded-lg border ${isWinner ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : ""}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                {isWinner && <Trophy className="h-5 w-5 text-amber-500" />}
                                <span className="font-medium">{getSupplierName(quote.supplierId)}</span>
                                <Badge variant="outline">Rank #{quote.overallRank}</Badge>
                              </div>
                              <div className="text-2xl font-bold">{score.toFixed(1)}</div>
                            </div>
                            <Progress value={score} className="h-3 mb-2" />
                            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground mt-3">
                              <div>
                                <span className="font-medium">Price:</span> {parseFloat(quote.totalPrice).toLocaleString()} {quote.currency}
                                {quote.priceRank && <span className="ml-1">(#{quote.priceRank})</span>}
                              </div>
                              <div>
                                <span className="font-medium">Quality:</span> {quote.qualityScore || "-"}
                              </div>
                              <div>
                                <span className="font-medium">Delivery:</span> {quote.deliveryDays ? `${quote.deliveryDays} days` : "-"}
                              </div>
                              <div>
                                <span className="font-medium">Compliance:</span> {quote.complianceScore || "-"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {rfqQuotes.some(q => !q.benchmarkScore) && (
                      <div className="text-center py-4">
                        <Button 
                          onClick={() => calculateBenchmarkMutation.mutate()}
                          disabled={calculateBenchmarkMutation.isPending}
                          data-testid="button-calculate-benchmark-inline"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate Benchmark Scores
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddSupplierDialogOpen} onOpenChange={setIsAddSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier to RFQ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Supplier</Label>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger data-testid="select-supplier">
                <SelectValue placeholder="Choose a supplier" />
              </SelectTrigger>
              <SelectContent>
                {availableSuppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableSuppliers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                All suppliers have already been invited to this RFQ
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSupplierDialogOpen(false)} data-testid="button-cancel-add-supplier">
              Cancel
            </Button>
            <Button
              onClick={() => addSupplierMutation.mutate(selectedSupplierId)}
              disabled={!selectedSupplierId || addSupplierMutation.isPending}
              data-testid="button-confirm-add-supplier"
            >
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddQuoteDialogOpen} onOpenChange={setIsAddQuoteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Supplier</Label>
              <Select 
                value={newQuote.supplierId} 
                onValueChange={(v) => setNewQuote({ ...newQuote, supplierId: v })}
              >
                <SelectTrigger data-testid="select-quote-supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliersWithQuotes.map((rs) => (
                    <SelectItem key={rs.supplierId} value={rs.supplierId}>
                      {getSupplierName(rs.supplierId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Total Price (DKK)</Label>
                <Input
                  type="number"
                  value={newQuote.totalPrice}
                  onChange={(e) => setNewQuote({ ...newQuote, totalPrice: e.target.value })}
                  placeholder="Enter price"
                  data-testid="input-quote-price"
                />
              </div>
              <div className="grid gap-2">
                <Label>Delivery Days</Label>
                <Input
                  type="number"
                  value={newQuote.deliveryDays}
                  onChange={(e) => setNewQuote({ ...newQuote, deliveryDays: e.target.value })}
                  placeholder="Days"
                  data-testid="input-quote-delivery"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Quality Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuote.qualityScore}
                  onChange={(e) => setNewQuote({ ...newQuote, qualityScore: e.target.value })}
                  data-testid="input-quote-quality"
                />
              </div>
              <div className="grid gap-2">
                <Label>Compliance (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuote.complianceScore}
                  onChange={(e) => setNewQuote({ ...newQuote, complianceScore: e.target.value })}
                  data-testid="input-quote-compliance"
                />
              </div>
              <div className="grid gap-2">
                <Label>ESG Score (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newQuote.esgScore}
                  onChange={(e) => setNewQuote({ ...newQuote, esgScore: e.target.value })}
                  data-testid="input-quote-esg"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={newQuote.notes}
                onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                placeholder="Additional notes about this quote..."
                data-testid="input-quote-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuoteDialogOpen(false)} data-testid="button-cancel-quote">
              Cancel
            </Button>
            <Button
              onClick={() => addQuoteMutation.mutate(newQuote)}
              disabled={!newQuote.supplierId || !newQuote.totalPrice || addQuoteMutation.isPending}
              data-testid="button-submit-quote"
            >
              Add Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award RFQ</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>
              Award this RFQ to <strong>{getSupplierName(selectedSupplierId)}</strong>?
            </p>
            <div className="grid gap-2">
              <Label>Award Reason</Label>
              <Textarea
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Explain why this supplier was selected..."
                data-testid="input-award-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAwardDialogOpen(false)} data-testid="button-cancel-award">
              Cancel
            </Button>
            <Button
              onClick={() => awardMutation.mutate()}
              disabled={awardMutation.isPending}
              data-testid="button-confirm-award"
            >
              <Award className="h-4 w-4 mr-2" />
              Award RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
