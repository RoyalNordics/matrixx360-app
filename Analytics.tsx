import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Building2, 
  MapPin, 
  Package, 
  Wrench, 
  AlertTriangle, 
  DollarSign,
  Users,
  Star,
  Clock,
  CheckCircle,
  BarChart3,
  PieChart,
  Target
} from "lucide-react";
import type { Customer, Location, ServiceModule, WorkOrder, Incident, Contract, Supplier, SalesCase, ServiceLog } from "@shared/schema";

export default function Analytics() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: serviceModulesData } = useQuery<{ modules: ServiceModule[] }>({
    queryKey: ["/api/service-modules"],
  });
  const serviceModules = serviceModulesData?.modules || [];

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: salesCases = [] } = useQuery<SalesCase[]>({
    queryKey: ["/api/sales-cases"],
  });

  const { data: serviceLogs = [] } = useQuery<ServiceLog[]>({
    queryKey: ["/api/service-logs"],
  });

  const safeParseNumber = (value: string | undefined | null): number => {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatNumber = (value: number): string => {
    return Number.isFinite(value) ? value.toLocaleString() : "0";
  };

  const activeModules = serviceModules.filter(m => m.status === "active").length;
  const activeContracts = contracts.filter(c => c.status === "active");
  const totalContractValue = activeContracts.reduce((sum, c) => sum + safeParseNumber(c.totalValue), 0);
  
  const completedWorkOrders = workOrders.filter(wo => wo.status === "completed").length;
  const totalWorkOrders = workOrders.length;
  const workOrderCompletionRate = totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0;

  const resolvedIncidents = incidents.filter(inc => inc.status === "resolved" || inc.status === "closed").length;
  const totalIncidents = incidents.length;
  const incidentResolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0;

  const wonCases = salesCases.filter(sc => sc.status === "won");
  const totalPipelineValue = salesCases
    .filter(sc => sc.status !== "won" && sc.status !== "lost")
    .reduce((sum, sc) => sum + safeParseNumber(sc.estimatedValue), 0);
  const wonValue = wonCases.reduce((sum, sc) => sum + safeParseNumber(sc.estimatedValue), 0);

  const suppliersByCategory: Record<string, number> = {};
  suppliers.forEach((supplier) => {
    const categories = supplier.categories as string[] || [];
    categories.forEach((cat) => {
      suppliersByCategory[cat] = (suppliersByCategory[cat] || 0) + 1;
    });
    if (categories.length === 0) {
      suppliersByCategory["Uncategorized"] = (suppliersByCategory["Uncategorized"] || 0) + 1;
    }
  });

  const topSuppliers = suppliers
    .filter(s => s.qualityRating && safeParseNumber(s.qualityRating) > 0)
    .sort((a, b) => safeParseNumber(b.qualityRating) - safeParseNumber(a.qualityRating))
    .slice(0, 5);

  const modulesByStatus = serviceModules.reduce((acc, module) => {
    const status = module.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const incidentsByPriority = incidents.reduce((acc, incident) => {
    const priority = incident.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workOrdersByStatus = workOrders.reduce((acc, wo) => {
    const status = wo.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const salesStatusConfig: Record<string, { label: string; color: string }> = {
    lead: { label: "Lead", color: "bg-gray-100 text-gray-800" },
    discovery: { label: "Discovery", color: "bg-blue-100 text-blue-800" },
    proposal: { label: "Proposal", color: "bg-purple-100 text-purple-800" },
    negotiation: { label: "Negotiation", color: "bg-yellow-100 text-yellow-800" },
    won: { label: "Won", color: "bg-green-100 text-green-800" },
    lost: { label: "Lost", color: "bg-red-100 text-red-800" },
  };

  return (
    <Layout title="Analytics & Strategy" subtitle="KPI dashboards, supplier performance, and cost optimization insights">
      <div className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contract Value</p>
                  <p className="text-2xl font-bold">{formatNumber(totalContractValue)} DKK</p>
                  <p className="text-xs text-muted-foreground mt-1">{activeContracts.length} active contracts</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Work Order Completion</p>
                  <p className="text-2xl font-bold">{workOrderCompletionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{completedWorkOrders} of {totalWorkOrders} completed</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Incident Resolution</p>
                  <p className="text-2xl font-bold">{incidentResolutionRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{resolvedIncidents} of {totalIncidents} resolved</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sales Pipeline</p>
                  <p className="text-2xl font-bold">{formatNumber(totalPipelineValue)} DKK</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatNumber(wonValue)} DKK won</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-xl font-bold">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="text-xl font-bold">{locations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Modules</p>
                  <p className="text-xl font-bold">{serviceModules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Logs</p>
                  <p className="text-xl font-bold">{serviceLogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="operations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="operations" data-testid="tab-operations">Operations</TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">Supplier Performance</TabsTrigger>
            <TabsTrigger value="sales" data-testid="tab-sales">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">Portfolio</TabsTrigger>
          </TabsList>

          <TabsContent value="operations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Work Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Work Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(workOrdersByStatus).map(([status, count]) => (
                      <div key={status} className="space-y-2" data-testid={`wo-status-${status}`}>
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{status.replace("_", " ")}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <Progress value={totalWorkOrders > 0 ? (count / totalWorkOrders) * 100 : 0} className="h-2" />
                      </div>
                    ))}
                    {Object.keys(workOrdersByStatus).length === 0 && (
                      <p className="text-muted-foreground text-sm">No work orders yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Incident Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Incident Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(incidentsByPriority).map(([priority, count]) => {
                      const colors: Record<string, string> = {
                        low: "bg-gray-500",
                        medium: "bg-blue-500",
                        high: "bg-orange-500",
                        critical: "bg-red-500",
                      };
                      return (
                        <div key={priority} className="flex items-center justify-between" data-testid={`incident-priority-${priority}`}>
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${colors[priority] || "bg-gray-500"}`} />
                            <span className="capitalize">{priority}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                    {Object.keys(incidentsByPriority).length === 0 && (
                      <p className="text-muted-foreground text-sm">No incidents yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Rated Suppliers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Rated Suppliers (Quality)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topSuppliers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No rated suppliers yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topSuppliers.map((supplier, index) => (
                        <div key={supplier.id} className="flex items-center justify-between" data-testid={`supplier-${supplier.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{supplier.qualityRating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suppliers by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Suppliers by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(suppliersByCategory).length === 0 ? (
                    <p className="text-muted-foreground text-sm">No suppliers yet</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(suppliersByCategory).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between" data-testid={`category-${category}`}>
                          <span>{category}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Pipeline by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Pipeline by Stage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesCases.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No sales cases yet</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(salesStatusConfig).map(([status, config]) => {
                        const cases = salesCases.filter(sc => sc.status === status);
                        const value = cases.reduce((sum, sc) => sum + safeParseNumber(sc.estimatedValue), 0);
                        return (
                          <div key={status} className="space-y-2" data-testid={`stage-${status}`}>
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge className={config.color}>{config.label}</Badge>
                                <span className="text-muted-foreground">({cases.length})</span>
                              </div>
                              <span className="font-medium">{formatNumber(value)} DKK</span>
                            </div>
                            <Progress value={salesCases.length > 0 ? (cases.length / salesCases.length) * 100 : 0} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Win/Loss Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Win/Loss Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Won Deals</p>
                          <p className="text-sm text-green-600">{wonCases.length} cases</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-800">{formatNumber(wonValue)} DKK</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">Lost Deals</p>
                          <p className="text-sm text-red-600">{salesCases.filter(sc => sc.status === "lost").length} cases</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-red-800">
                        {formatNumber(salesCases.filter(sc => sc.status === "lost").reduce((sum, sc) => sum + safeParseNumber(sc.estimatedValue), 0))} DKK
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Customer Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Customers</span>
                      <span className="font-bold text-xl">{customers.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Locations</span>
                      <span className="font-bold text-xl">{locations.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg Locations/Customer</span>
                      <span className="font-bold text-xl">
                        {customers.length > 0 ? (locations.length / customers.length).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Module Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Module Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(modulesByStatus).map(([status, count]) => {
                      const colors: Record<string, string> = {
                        active: "bg-green-500",
                        inactive: "bg-gray-500",
                        pending: "bg-yellow-500",
                        overdue: "bg-red-500",
                      };
                      return (
                        <div key={status} className="flex items-center justify-between" data-testid={`module-status-${status}`}>
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${colors[status] || "bg-gray-500"}`} />
                            <span className="capitalize">{status}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                    {Object.keys(modulesByStatus).length === 0 && (
                      <p className="text-muted-foreground text-sm">No modules yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Coverage Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Modules</span>
                      <span className="font-bold text-xl">{activeModules}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Modules</span>
                      <span className="font-bold text-xl">{serviceModules.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Rate</span>
                      <span className="font-bold text-xl">
                        {serviceModules.length > 0 ? ((activeModules / serviceModules.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
