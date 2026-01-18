import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  MapPin, 
  Search, 
  Grid3X3, 
  List, 
  LayoutGrid,
  ChevronRight,
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Layers
} from "lucide-react";
import { Link } from "wouter";
import type { Customer, Location, ServiceModule, ServiceCategory, ServiceTemplate } from "@shared/schema";

interface LocationWithModules extends Location {
  modules: ServiceModule[];
  moduleCount: number;
  activeCount: number;
  overdueCount: number;
}

interface CustomerWithLocations {
  customer: Customer;
  locations: LocationWithModules[];
  totalModules: number;
  activeModules: number;
  overdueModules: number;
}

export default function ServiceMap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "tree">("grid");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
  });

  const { data: moduleData } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules'],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  const { data: templates = [] } = useQuery<ServiceTemplate[]>({
    queryKey: ['/api/service-templates'],
  });

  const modules = moduleData?.modules || [];

  // Group modules by location
  const modulesByLocation = modules.reduce((acc, module) => {
    if (!acc[module.locationId]) {
      acc[module.locationId] = [];
    }
    acc[module.locationId].push(module);
    return acc;
  }, {} as Record<string, ServiceModule[]>);

  // Build hierarchical structure: Customer -> Location -> Modules
  const customerHierarchy: CustomerWithLocations[] = customers.map(customer => {
    const customerLocations = locations.filter(loc => loc.customerId === customer.id);
    
    const locationsWithModules: LocationWithModules[] = customerLocations.map(location => {
      const locationModules = modulesByLocation[location.id] || [];
      const filteredModules = selectedCategory === "all" 
        ? locationModules 
        : locationModules.filter(m => m.categoryId === selectedCategory);
      
      return {
        ...location,
        modules: filteredModules,
        moduleCount: filteredModules.length,
        activeCount: filteredModules.filter(m => m.status === "active").length,
        overdueCount: filteredModules.filter(m => m.status === "overdue").length,
      };
    });

    const totalModules = locationsWithModules.reduce((sum, loc) => sum + loc.moduleCount, 0);
    const activeModules = locationsWithModules.reduce((sum, loc) => sum + loc.activeCount, 0);
    const overdueModules = locationsWithModules.reduce((sum, loc) => sum + loc.overdueCount, 0);

    return {
      customer,
      locations: locationsWithModules,
      totalModules,
      activeModules,
      overdueModules,
    };
  }).filter(ch => {
    if (selectedCustomer !== "all" && ch.customer.id !== selectedCustomer) return false;
    if (searchTerm) {
      const matchesCustomer = ch.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = ch.locations.some(loc => 
        loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesCustomer || matchesLocation;
    }
    return true;
  });

  const toggleCustomerExpand = (customerId: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Unknown";
  };

  const getTemplateName = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.templateName || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "overdue": return "bg-red-500";
      case "completed": return "bg-blue-500";
      case "inactive": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  // Calculate overall stats
  const totalCustomers = customerHierarchy.length;
  const totalLocations = customerHierarchy.reduce((sum, ch) => sum + ch.locations.length, 0);
  const totalModulesCount = customerHierarchy.reduce((sum, ch) => sum + ch.totalModules, 0);
  const overdueModulesCount = customerHierarchy.reduce((sum, ch) => sum + ch.overdueModules, 0);

  return (
    <Layout
      title="Service Map"
      subtitle="Visual overview of all service modules organized by customer, location, and zone"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-customers">{totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-locations">{totalLocations}</p>
                <p className="text-sm text-muted-foreground">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Wrench className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-modules">{totalModulesCount}</p>
                <p className="text-sm text-muted-foreground">Service Modules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-overdue">{overdueModulesCount}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full sm:w-56" data-testid="select-customer">
                <SelectValue placeholder="All Customers" />
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

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-56" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "tree" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("tree")}
                data-testid="button-view-tree"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {customerHierarchy.map((ch) => (
            <Card key={ch.customer.id} className="overflow-hidden" data-testid={`card-customer-${ch.customer.id}`}>
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        <Link href={`/customers/${ch.customer.id}`} className="hover:underline" data-testid={`link-customer-${ch.customer.id}`}>
                          {ch.customer.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>{ch.locations.length} locations</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{ch.totalModules}</p>
                    <p className="text-xs text-muted-foreground">modules</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {ch.overdueModules > 0 && (
                  <div className="flex items-center gap-2 text-red-600 mb-3 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{ch.overdueModules} overdue service{ch.overdueModules > 1 ? 's' : ''}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  {ch.locations.slice(0, 3).map((location) => (
                    <div 
                      key={location.id} 
                      className="p-3 bg-muted/30 rounded-lg"
                      data-testid={`card-location-${location.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Link 
                              href={`/locations/${location.id}`} 
                              className="font-medium hover:underline"
                              data-testid={`link-location-${location.id}`}
                            >
                              {location.name || `${location.street} ${location.streetNumber || ''}`}
                            </Link>
                            <p className="text-xs text-muted-foreground">{location.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {location.moduleCount} modules
                          </Badge>
                          {location.overdueCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {location.overdueCount} overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Module list within location */}
                      {location.modules.length > 0 && (
                        <div className="ml-7 mt-2 space-y-1">
                          {location.modules.slice(0, 3).map((module) => (
                            <Link
                              key={module.id}
                              href={`/service-modules/${module.id}`}
                              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 text-sm transition-colors"
                              data-testid={`link-module-grid-${module.id}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`}></div>
                              <span className="font-mono text-xs">{module.moduleId}</span>
                              <span className="text-muted-foreground text-xs">•</span>
                              <span className="text-muted-foreground text-xs truncate">{getTemplateName(module.templateId)}</span>
                            </Link>
                          ))}
                          {location.modules.length > 3 && (
                            <Link
                              href={`/locations/${location.id}`}
                              className="text-xs text-primary hover:underline pl-4"
                            >
                              +{location.modules.length - 3} more modules
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {ch.locations.length > 3 && (
                    <Link 
                      href={`/customers/${ch.customer.id}`}
                      className="block text-center text-sm text-primary hover:underline py-2"
                    >
                      +{ch.locations.length - 3} more locations
                    </Link>
                  )}
                  
                  {ch.locations.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      No locations added yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {customerHierarchy.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No customers found matching your filters</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* List View - Tabular format showing all modules */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Module ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerHierarchy.flatMap((ch) =>
                    ch.locations.flatMap((location) =>
                      location.modules.map((module) => (
                        <tr key={module.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-module-list-${module.id}`}>
                          <td className="px-4 py-3">
                            <Link 
                              href={`/customers/${ch.customer.id}`}
                              className="text-sm font-medium hover:underline"
                              data-testid={`link-customer-list-${ch.customer.id}`}
                            >
                              {ch.customer.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link 
                              href={`/locations/${location.id}`}
                              className="text-sm hover:underline flex items-center gap-1"
                              data-testid={`link-location-list-${location.id}`}
                            >
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {location.name || location.city}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link 
                              href={`/service-modules/${module.id}`}
                              className="font-mono text-sm hover:underline"
                              data-testid={`link-module-list-${module.id}`}
                            >
                              {module.moduleId}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {getTemplateName(module.templateId)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryName(module.categoryId)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`}></div>
                              <span className="text-sm capitalize">{module.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
              
              {customerHierarchy.every(ch => ch.totalModules === 0) && (
                <div className="py-12 text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No service modules found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree View */}
      {viewMode === "tree" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {customerHierarchy.map((ch) => (
                <div key={ch.customer.id} className="border rounded-lg overflow-hidden" data-testid={`tree-customer-${ch.customer.id}`}>
                  <button
                    onClick={() => toggleCustomerExpand(ch.customer.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`button-expand-${ch.customer.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${expandedCustomers.has(ch.customer.id) ? 'rotate-90' : ''}`} 
                      />
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{ch.customer.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ch.locations.length} locations
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{ch.totalModules} modules</span>
                      {ch.overdueModules > 0 && (
                        <Badge variant="destructive" className="text-xs">{ch.overdueModules} overdue</Badge>
                      )}
                    </div>
                  </button>
                  
                  {expandedCustomers.has(ch.customer.id) && (
                    <div className="border-t bg-muted/20">
                      {ch.locations.map((location) => (
                        <div key={location.id} className="border-b last:border-b-0">
                          <div className="flex items-center justify-between p-3 pl-12 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <Link 
                                  href={`/locations/${location.id}`}
                                  className="font-medium hover:underline"
                                  data-testid={`link-location-tree-${location.id}`}
                                >
                                  {location.name || `${location.street} ${location.streetNumber || ''}`}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {[location.street, location.streetNumber, location.zipCode, location.city]
                                    .filter(Boolean)
                                    .join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs text-muted-foreground">{location.activeCount}</span>
                              </div>
                              {location.overdueCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  <span className="text-xs text-muted-foreground">{location.overdueCount}</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">{location.moduleCount} modules</Badge>
                            </div>
                          </div>
                          
                          {/* Module details within location */}
                          {location.modules.length > 0 && (
                            <div className="pl-20 pr-4 pb-3 space-y-1">
                              {location.modules.slice(0, 5).map((module) => (
                                <Link
                                  key={module.id}
                                  href={`/service-modules/${module.id}`}
                                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-sm"
                                  data-testid={`link-module-${module.id}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`}></div>
                                    <span>{module.moduleId}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground">{getTemplateName(module.templateId)}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {getCategoryName(module.categoryId)}
                                  </Badge>
                                </Link>
                              ))}
                              {location.modules.length > 5 && (
                                <Link
                                  href={`/locations/${location.id}`}
                                  className="block text-center text-xs text-primary hover:underline py-1"
                                >
                                  +{location.modules.length - 5} more modules
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {ch.locations.length === 0 && (
                        <div className="p-4 pl-12 text-sm text-muted-foreground">
                          No locations added yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {customerHierarchy.length === 0 && (
                <div className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No customers found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}
