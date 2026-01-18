import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { ClipboardCheck, Plus, CheckCircle, AlertCircle, Building2, Calendar, User, MapPin, Package, FileText, XCircle, Info } from "lucide-react";
import type { ServiceLog, ServiceModule, Location, Customer } from "@shared/schema";
import { format } from "date-fns";

const logTypeConfig: Record<string, { label: string; color: string }> = {
  service: { label: "Service", color: "bg-blue-100 text-blue-800" },
  inspection: { label: "Inspection", color: "bg-purple-100 text-purple-800" },
  repair: { label: "Repair", color: "bg-orange-100 text-orange-800" },
  note: { label: "Note", color: "bg-gray-100 text-gray-600" },
};

const outcomeConfig: Record<string, { label: string; color: string; icon: any }> = {
  passed: { label: "Passed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
  needs_attention: { label: "Needs Attention", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
};

export default function ServiceLogs() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: serviceLogs = [], isLoading } = useQuery<ServiceLog[]>({
    queryKey: ["/api/service-logs"],
  });

  const { data: serviceModulesData } = useQuery<{ modules: ServiceModule[] }>({
    queryKey: ["/api/service-modules"],
  });
  const serviceModules = serviceModulesData?.modules || [];

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createServiceLogMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/service-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-logs"] });
      setIsCreateOpen(false);
      toast({ title: "Service log created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating service log", description: error.message, variant: "destructive" });
    },
  });

  const updateOutcomeMutation = useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome: string }) => {
      return apiRequest("PUT", `/api/service-logs/${id}`, { outcome });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-logs"] });
      toast({ title: "Service log outcome updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating service log", description: error.message, variant: "destructive" });
    },
  });

  const filteredLogs = serviceLogs.filter((log) => {
    if (typeFilter !== "all" && log.logType !== typeFilter) return false;
    if (outcomeFilter !== "all" && log.outcome !== outcomeFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const module = serviceModules.find(m => m.id === log.serviceModuleId);
      return (
        log.description.toLowerCase().includes(search) ||
        module?.moduleId.toLowerCase().includes(search) ||
        (log.technicianName && log.technicianName.toLowerCase().includes(search))
      );
    }
    return true;
  });

  const getModuleInfo = (moduleId: string) => {
    const module = serviceModules.find(m => m.id === moduleId);
    if (!module) return { moduleId: "Unknown", location: null, customer: null };
    const location = locations.find(l => l.id === module.locationId);
    const customer = location ? customers.find(c => c.id === location.customerId) : null;
    return { moduleId: module.moduleId, location, customer };
  };

  const passedCount = serviceLogs.filter(l => l.outcome === "passed").length;
  const failedCount = serviceLogs.filter(l => l.outcome === "failed").length;
  const needsAttentionCount = serviceLogs.filter(l => l.outcome === "needs_attention").length;

  const handleCreateServiceLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createServiceLogMutation.mutate({
      serviceModuleId: formData.get("serviceModuleId"),
      logType: formData.get("logType"),
      description: formData.get("description"),
      technicianName: formData.get("technicianName") || null,
      outcome: formData.get("outcome") || null,
      serviceDate: formData.get("serviceDate") || new Date().toISOString(),
    });
  };

  return (
    <Layout title="Service Logs" subtitle="Track maintenance and service activities">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{serviceLogs.length}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold">{passedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="text-2xl font-bold">{needsAttentionCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{failedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                  data-testid="input-search-logs"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-type-filter">
                    <SelectValue placeholder="Log Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(logTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-outcome-filter">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    {Object.entries(outcomeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-log">
                    <Plus className="h-4 w-4 mr-2" />
                    New Service Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Service Log</DialogTitle>
                    <DialogDescription>Log a maintenance or service activity</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateServiceLog} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Service Module *</Label>
                      <Select name="serviceModuleId" required>
                        <SelectTrigger data-testid="select-module">
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceModules.map((module) => {
                            const info = getModuleInfo(module.id);
                            return (
                              <SelectItem key={module.id} value={module.id}>
                                {module.moduleId} {info.location ? `- ${info.location.name}` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Log Type *</Label>
                        <Select name="logType" defaultValue="service">
                          <SelectTrigger data-testid="select-log-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(logTypeConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Service Date</Label>
                        <Input
                          name="serviceDate"
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          data-testid="input-service-date"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        name="description"
                        placeholder="Describe the service performed..."
                        required
                        data-testid="input-log-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Technician Name</Label>
                        <Input
                          name="technicianName"
                          placeholder="Technician name"
                          data-testid="input-technician"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Outcome</Label>
                        <Select name="outcome">
                          <SelectTrigger data-testid="select-outcome">
                            <SelectValue placeholder="Select outcome" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(outcomeConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createServiceLogMutation.isPending} data-testid="button-submit-log">
                        {createServiceLogMutation.isPending ? "Creating..." : "Create Log"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Service Logs List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading service logs...</p>
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No service logs found</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-log">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first service log
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => {
              const logType = logTypeConfig[log.logType] || logTypeConfig.service;
              const outcome = log.outcome ? outcomeConfig[log.outcome] : null;
              const OutcomeIcon = outcome?.icon || Info;
              const moduleInfo = getModuleInfo(log.serviceModuleId);
              
              return (
                <Card key={log.id} className="hover:shadow-md transition-shadow" data-testid={`card-log-${log.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={logType.color}>{logType.label}</Badge>
                          {outcome && (
                            <Badge className={outcome.color}>
                              <OutcomeIcon className="h-3 w-3 mr-1" />
                              {outcome.label}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm mb-3">{log.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {moduleInfo.moduleId}
                          </div>
                          {moduleInfo.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {moduleInfo.location.name}
                            </div>
                          )}
                          {moduleInfo.customer && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {moduleInfo.customer.name}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(log.serviceDate), "dd MMM yyyy")}
                          </div>
                          {log.technicianName && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {log.technicianName}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {!log.outcome && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                              onClick={() => updateOutcomeMutation.mutate({ id: log.id, outcome: "passed" })}
                              data-testid={`button-passed-${log.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Passed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                              onClick={() => updateOutcomeMutation.mutate({ id: log.id, outcome: "needs_attention" })}
                              data-testid={`button-attention-${log.id}`}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Needs Attention
                            </Button>
                          </>
                        )}
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
