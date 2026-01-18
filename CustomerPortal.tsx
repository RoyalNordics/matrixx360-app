import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MapPin, 
  Package, 
  Wrench, 
  AlertTriangle, 
  FileCheck,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Calendar
} from "lucide-react";
import type { Customer, Location, ServiceModule, WorkOrder, Incident, Contract, ServiceLog } from "@shared/schema";
import { format } from "date-fns";

export default function CustomerPortal() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");

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

  const { data: serviceLogs = [] } = useQuery<ServiceLog[]>({
    queryKey: ["/api/service-logs"],
  });

  const filteredLocations = selectedCustomerId === "all" 
    ? locations 
    : locations.filter(l => l.customerId === selectedCustomerId);

  const locationIds = new Set(filteredLocations.map(l => l.id));
  
  const filteredModules = serviceModules.filter(m => locationIds.has(m.locationId));
  const moduleIds = new Set(filteredModules.map(m => m.id));

  const filteredWorkOrders = workOrders.filter(wo => wo.serviceModuleId && moduleIds.has(wo.serviceModuleId));
  const filteredIncidents = incidents.filter(inc => inc.serviceModuleId && moduleIds.has(inc.serviceModuleId));
  const filteredServiceLogs = serviceLogs.filter(sl => sl.serviceModuleId && moduleIds.has(sl.serviceModuleId));
  const filteredContracts = selectedCustomerId === "all" 
    ? contracts 
    : contracts.filter(c => c.customerId && c.customerId === selectedCustomerId);
  
  const safeParseNumber = (value: string | undefined | null): number => {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatNumber = (value: number): string => {
    return Number.isFinite(value) ? value.toLocaleString() : "0";
  };

  const activeWorkOrders = filteredWorkOrders.filter(wo => wo.status === "in_progress" || wo.status === "pending");
  const openIncidents = filteredIncidents.filter(inc => inc.status !== "resolved" && inc.status !== "closed");
  const activeContracts = filteredContracts.filter(c => c.status === "active");
  const recentLogs = filteredServiceLogs.slice(0, 10);

  const getModuleInfo = (moduleId: string) => {
    const module = filteredModules.find(m => m.id === moduleId);
    if (!module) return null;
    const location = filteredLocations.find(l => l.id === module.locationId);
    if (!location) return null;
    return { moduleId: module.moduleId, location };
  };

  const getLocationName = (locationId: string) => {
    const location = filteredLocations.find(l => l.id === locationId);
    return location?.name || null;
  };

  const workOrderStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-gray-100 text-gray-800" },
    scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Completed", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  };

  const incidentPriorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "bg-gray-100 text-gray-800" },
    medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
    high: { label: "High", color: "bg-orange-100 text-orange-800" },
    critical: { label: "Critical", color: "bg-red-100 text-red-800" },
  };

  return (
    <Layout title="Customer Portal" subtitle="Live overview of your facility management services">
      <div className="space-y-6">
        {/* Customer Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-[300px]" data-testid="select-customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Viewing {selectedCustomerId === "all" ? "all customers" : customers.find(c => c.id === selectedCustomerId)?.name}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold">{filteredLocations.length}</p>
                </div>
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Modules</p>
                  <p className="text-2xl font-bold">{filteredModules.filter(m => m.status === "active").length}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Work Orders</p>
                  <p className="text-2xl font-bold">{activeWorkOrders.length}</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Incidents</p>
                  <p className="text-2xl font-bold">{openIncidents.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-2xl font-bold">{activeContracts.length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="work-orders" data-testid="tab-work-orders">Work Orders ({activeWorkOrders.length})</TabsTrigger>
            <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents ({openIncidents.length})</TabsTrigger>
            <TabsTrigger value="service-history" data-testid="tab-service-history">Service History</TabsTrigger>
            <TabsTrigger value="contracts" data-testid="tab-contracts">Contracts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Locations Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Locations Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredLocations.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No locations found</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredLocations.slice(0, 5).map((location) => {
                        const moduleCount = serviceModules.filter(m => m.locationId === location.id).length;
                        return (
                          <div key={location.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`location-summary-${location.id}`}>
                            <div>
                              <p className="font-medium">{location.name}</p>
                              <p className="text-sm text-muted-foreground">{location.city}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{moduleCount} modules</Badge>
                            </div>
                          </div>
                        );
                      })}
                      {filteredLocations.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{filteredLocations.length - 5} more locations
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentLogs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent service activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentLogs.slice(0, 5).map((log) => {
                        const moduleInfo = getModuleInfo(log.serviceModuleId);
                        if (!moduleInfo) return null;
                        return (
                          <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg" data-testid={`activity-${log.id}`}>
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm">{log.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {moduleInfo.location.name} • {format(new Date(log.serviceDate), "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="work-orders">
            <Card>
              <CardContent className="pt-6">
                {activeWorkOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No active work orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeWorkOrders.map((wo) => {
                      const moduleInfo = getModuleInfo(wo.serviceModuleId || "");
                      if (!moduleInfo) return null;
                      const status = workOrderStatusConfig[wo.status] || workOrderStatusConfig.pending;
                      return (
                        <div key={wo.id} className="p-4 border rounded-lg" data-testid={`work-order-${wo.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-muted-foreground">{wo.workOrderNumber}</span>
                                <Badge className={status.color}>{status.label}</Badge>
                              </div>
                              <h4 className="font-medium">{wo.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {moduleInfo.moduleId}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {moduleInfo.location.name}
                                </span>
                              </div>
                            </div>
                            {wo.scheduledDate && (
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(wo.scheduledDate), "dd MMM yyyy")}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents">
            <Card>
              <CardContent className="pt-6">
                {openIncidents.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No open incidents</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openIncidents.map((incident) => {
                      const moduleInfo = getModuleInfo(incident.serviceModuleId || "");
                      if (!moduleInfo) return null;
                      const priority = incidentPriorityConfig[incident.priority] || incidentPriorityConfig.medium;
                      return (
                        <div key={incident.id} className="p-4 border rounded-lg" data-testid={`incident-${incident.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-muted-foreground">{incident.incidentNumber}</span>
                                <Badge className={priority.color}>{priority.label}</Badge>
                              </div>
                              <h4 className="font-medium">{incident.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {moduleInfo.moduleId}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {moduleInfo.location.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {format(new Date(incident.createdAt), "dd MMM yyyy")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service-history">
            <Card>
              <CardContent className="pt-6">
                {filteredServiceLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No service history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredServiceLogs.map((log) => {
                      const moduleInfo = getModuleInfo(log.serviceModuleId);
                      if (!moduleInfo) return null;
                      return (
                        <div key={log.id} className="p-4 border rounded-lg" data-testid={`service-log-${log.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{log.logType}</Badge>
                                {log.outcome && (
                                  <Badge className={log.outcome === "passed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                    {log.outcome}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{log.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  {moduleInfo.moduleId}
                                </span>
                                {log.technicianName && (
                                  <span>Technician: {log.technicianName}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {format(new Date(log.serviceDate), "dd MMM yyyy")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardContent className="pt-6">
                {filteredContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No contracts found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContracts.map((contract) => (
                      <div key={contract.id} className="p-4 border rounded-lg" data-testid={`contract-${contract.id}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">{contract.contractNumber}</span>
                              <Badge className={contract.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                                {contract.status}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{contract.title}</h4>
                            {contract.description && (
                              <p className="text-sm text-muted-foreground mt-1">{contract.description}</p>
                            )}
                            {contract.startDate && contract.endDate && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Valid: {format(new Date(contract.startDate), "dd MMM yyyy")} - {format(new Date(contract.endDate), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{formatNumber(safeParseNumber(contract.totalValue))} {contract.currency}</p>
                            <p className="text-sm text-muted-foreground">Contract Value</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
