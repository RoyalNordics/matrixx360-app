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
import { AlertTriangle, Plus, Clock, CheckCircle, XCircle, AlertCircle, Building2, MapPin, Calendar, User, Eye, ArrowUp, Zap } from "lucide-react";
import type { Incident, Customer, Location, ServiceModule } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-red-100 text-red-800", icon: AlertCircle },
  investigating: { label: "Investigating", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Zap },
  pending_customer: { label: "Pending Customer", color: "bg-orange-100 text-orange-800", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800", icon: null },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800", icon: null },
  high: { label: "High", color: "bg-orange-100 text-orange-800", icon: ArrowUp },
  critical: { label: "Critical", color: "bg-red-100 text-red-800", icon: AlertTriangle },
};

const incidentTypeConfig: Record<string, string> = {
  equipment_failure: "Equipment Failure",
  service_disruption: "Service Disruption",
  safety_hazard: "Safety Hazard",
  customer_complaint: "Customer Complaint",
  vandalism: "Vandalism",
  weather_damage: "Weather Damage",
  other: "Other",
};

export default function Incidents() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: serviceModules = [] } = useQuery<ServiceModule[]>({
    queryKey: ["/api/service-modules"],
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/incidents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      setIsCreateOpen(false);
      toast({ title: "Incident reported successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error reporting incident", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/incidents/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      toast({ title: "Incident status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating incident", description: error.message, variant: "destructive" });
    },
  });

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter !== "all" && incident.status !== statusFilter) return false;
    if (priorityFilter !== "all" && incident.priority !== priorityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const location = locations.find(l => l.id === incident.locationId);
      return (
        incident.incidentNumber.toLowerCase().includes(search) ||
        incident.title.toLowerCase().includes(search) ||
        location?.name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return null;
    return locations.find(l => l.id === locationId)?.name;
  };

  const getModuleId = (moduleId: string | null) => {
    if (!moduleId) return null;
    return serviceModules.find(m => m.id === moduleId)?.moduleId;
  };

  const openCount = incidents.filter(i => i.status === "open").length;
  const criticalCount = incidents.filter(i => i.priority === "critical" && !["resolved", "closed"].includes(i.status)).length;
  const inProgressCount = incidents.filter(i => ["investigating", "in_progress"].includes(i.status)).length;
  const resolvedTodayCount = incidents.filter(i => {
    if (i.status !== "resolved" || !i.resolvedAt) return false;
    const resolved = new Date(i.resolvedAt);
    const today = new Date();
    return resolved.toDateString() === today.toDateString();
  }).length;

  const handleCreateIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIncidentMutation.mutate({
      customerId: formData.get("customerId"),
      locationId: formData.get("locationId") || null,
      serviceModuleId: formData.get("serviceModuleId") || null,
      title: formData.get("title"),
      description: formData.get("description") || null,
      incidentType: formData.get("incidentType"),
      priority: formData.get("priority"),
      reportedByName: formData.get("reportedByName") || null,
      reportedByEmail: formData.get("reportedByEmail") || null,
    });
  };

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const filteredLocations = locations.filter(l => !selectedCustomerId || l.customerId === selectedCustomerId);

  return (
    <Layout title="Incidents" subtitle="Track and manage service incidents and escalations">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Incidents</p>
                  <p className="text-2xl font-bold">{openCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
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
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved Today</p>
                  <p className="text-2xl font-bold">{resolvedTodayCount}</p>
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
              <div className="flex gap-4 flex-wrap flex-1">
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-incidents"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
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
                  <Button variant="destructive" data-testid="button-report-incident">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Incident
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Report New Incident</DialogTitle>
                    <DialogDescription>Log a service incident or issue</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateIncident} className="space-y-4">
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
                        <Label>Location</Label>
                        <Select name="locationId">
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
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
                      <Label>Incident Title *</Label>
                      <Input
                        name="title"
                        placeholder="e.g., HVAC system failure in Building A"
                        required
                        data-testid="input-incident-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        name="description"
                        placeholder="Detailed description of the incident..."
                        rows={3}
                        data-testid="input-incident-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Incident Type *</Label>
                        <Select name="incidentType" defaultValue="equipment_failure">
                          <SelectTrigger data-testid="select-incident-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(incidentTypeConfig).map(([key, label]) => (
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
                        <Label>Reported By</Label>
                        <Input
                          name="reportedByName"
                          placeholder="Name of reporter"
                          data-testid="input-reported-by-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reporter Email</Label>
                        <Input
                          name="reportedByEmail"
                          type="email"
                          placeholder="email@example.com"
                          data-testid="input-reporter-email"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="destructive" disabled={createIncidentMutation.isPending} data-testid="button-submit-incident">
                        {createIncidentMutation.isPending ? "Reporting..." : "Report Incident"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading incidents...</p>
              </CardContent>
            </Card>
          ) : filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-muted-foreground">No incidents found</p>
                <p className="text-sm text-muted-foreground mt-1">All systems operating normally</p>
              </CardContent>
            </Card>
          ) : (
            filteredIncidents.map((incident) => {
              const status = statusConfig[incident.status] || statusConfig.open;
              const priority = priorityConfig[incident.priority] || priorityConfig.medium;
              const StatusIcon = status.icon;
              const isCritical = incident.priority === "critical";
              
              return (
                <Card 
                  key={incident.id} 
                  className={`hover:shadow-md transition-shadow ${isCritical && !["resolved", "closed"].includes(incident.status) ? 'border-red-400 border-2' : ''}`}
                  data-testid={`card-incident-${incident.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">{incident.incidentNumber}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className={priority.color}>
                            {priority.icon && <ArrowUp className="h-3 w-3 mr-1" />}
                            {priority.label}
                          </Badge>
                          <Badge variant="outline">{incidentTypeConfig[incident.incidentType]}</Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{incident.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {getCustomerName(incident.customerId)}
                          </div>
                          {getLocationName(incident.locationId) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {getLocationName(incident.locationId)}
                            </div>
                          )}
                          {getModuleId(incident.serviceModuleId) && (
                            <Badge variant="outline" className="text-xs">
                              Module: {getModuleId(incident.serviceModuleId)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Reported {format(new Date(incident.createdAt), "dd MMM yyyy HH:mm")}
                          </div>
                          {incident.reportedByName && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {incident.reportedByName}
                            </div>
                          )}
                          {incident.resolvedAt && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              Resolved {format(new Date(incident.resolvedAt), "dd MMM yyyy HH:mm")}
                            </div>
                          )}
                        </div>
                        
                        {incident.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{incident.description}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {incident.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: incident.id, status: "investigating" })}
                            data-testid={`button-investigate-${incident.id}`}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Investigate
                          </Button>
                        )}
                        {["investigating", "in_progress"].includes(incident.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700"
                            onClick={() => updateStatusMutation.mutate({ id: incident.id, status: "resolved" })}
                            data-testid={`button-resolve-${incident.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        <Link href={`/incidents/${incident.id}`}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${incident.id}`}>
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
