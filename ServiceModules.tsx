import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, FileText, Calendar, User, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import type { ServiceModule, Customer, Location, ServiceTemplate, Supplier, ServiceCategory, InsertServiceModule } from "@shared/schema";

const moduleFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  locationId: z.string().min(1, "Location is required"),
  templateId: z.string().min(1, "Service template is required"),
  supplierId: z.string().optional(),
  responsibleUserId: z.string().optional(),
  nextServiceDate: z.string().optional(),
  notes: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleFormSchema>;

export default function ServiceModules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const { data: moduleData, isLoading } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules'],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: templates = [] } = useQuery<ServiceTemplate[]>({
    queryKey: ['/api/service-templates'],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  // Get locations for selected customer
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/customers', selectedCustomer, '/locations'],
    enabled: !!selectedCustomer,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertServiceModule) => {
      const response = await apiRequest('POST', '/api/service-modules', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules'] });
      setIsCreateDialogOpen(false);
      form.reset();
      setFieldValues({});
      setSelectedCustomer("");
      toast({ title: "Success", description: "Service module created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create service module",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/service-modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules'] });
      toast({ title: "Success", description: "Service module deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete service module",
        variant: "destructive" 
      });
    },
  });

  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      customerId: "",
      locationId: "",
      templateId: "",
      supplierId: "",
      responsibleUserId: "",
      nextServiceDate: "",
      notes: "",
    },
  });

  const handleFieldValueChange = (fieldId: string, value: any, fieldType?: string) => {
    let processedValue = value;
    
    // Convert number inputs to actual numbers
    if (fieldType === 'number' && value !== '') {
      processedValue = parseFloat(value) || 0;
    } else if (fieldType === 'number' && value === '') {
      processedValue = undefined;
    }
    
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: processedValue
    }));
  };

  const filteredModules = (moduleData?.modules || []).filter(module => {
    const matchesSearch = module.moduleId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || module.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || module.categoryId === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const onSubmit = (data: ModuleFormData) => {
    const template = templates.find(t => t.id === data.templateId);
    if (!template) {
      toast({ 
        title: "Error", 
        description: "Selected template not found",
        variant: "destructive" 
      });
      return;
    }

    const moduleData: InsertServiceModule = {
      customerId: data.customerId,
      locationId: data.locationId,
      templateId: data.templateId,
      categoryId: template.categoryId,
      supplierId: data.supplierId && data.supplierId !== "none" ? data.supplierId : undefined,
      responsibleUserId: data.responsibleUserId || undefined,
      fieldValues: fieldValues,
      nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : undefined,
      notes: data.notes || undefined,
    };

    createMutation.mutate(moduleData);
  };

  const handleDelete = (module: ServiceModule) => {
    if (confirm(`Are you sure you want to delete service module ${module.moduleId}?`)) {
      deleteMutation.mutate(module.id);
    }
  };

  const getStatusBadge = (status: string, nextServiceDate?: string) => {
    if (nextServiceDate) {
      const serviceDate = new Date(nextServiceDate);
      const now = new Date();
      const tenDaysFromNow = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));
      
      if (serviceDate < now) {
        return <Badge variant="destructive">Overdue</Badge>;
      } else if (serviceDate <= tenDaysFromNow) {
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Due Soon</Badge>;
      }
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    
    return (
      <Badge 
        style={{ backgroundColor: `${category.color || '#3B82F6'}20`, color: category.color || '#3B82F6' }}
        className="border-0"
      >
        {category.name}
      </Badge>
    );
  };

  const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'Unknown';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Unknown Location';
  const getSupplierName = (supplierId: string | null | undefined) => {
    if (!supplierId) return null;
    return suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
  };

  // Filter suppliers based on selected template category
  const selectedTemplate = templates.find(t => t.id === form.watch('templateId'));
  const availableSuppliers = selectedTemplate 
    ? suppliers.filter(supplier => 
        Array.isArray(supplier.categories) && 
        supplier.categories.includes(selectedTemplate.categoryId)
      )
    : [];

  return (
    <Layout 
      title="Service Modules" 
      subtitle={`${moduleData?.total || 0} total service modules`}
      actions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-service-module-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Service Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Service Module</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCustomer(value);
                        form.setValue('locationId', ''); // Reset location when customer changes
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="customer-select">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCustomer}>
                        <FormControl>
                          <SelectTrigger data-testid="location-select">
                            <SelectValue placeholder={selectedCustomer ? "Select a location" : "Select customer first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="template-select">
                            <SelectValue placeholder="Select a service template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.templateName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTemplate}>
                        <FormControl>
                          <SelectTrigger data-testid="supplier-select">
                            <SelectValue placeholder={selectedTemplate ? "Select a supplier" : "Select template first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No supplier selected</SelectItem>
                          {availableSuppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextServiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Service Date (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="next-service-date-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="notes-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dynamic Template Fields */}
                {selectedTemplate && selectedTemplate.fields && Array.isArray(selectedTemplate.fields) && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Template Fields</h4>
                    {(selectedTemplate.fields as any[]).map((field: any) => (
                      <div key={field.id}>
                        {field.type === 'text' && (
                          <FormItem>
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            <FormControl>
                              <Input
                                onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                data-testid={`field-${field.id}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                        
                        {field.type === 'number' && (
                          <FormItem>
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                onChange={(e) => handleFieldValueChange(field.id, e.target.value, 'number')}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                data-testid={`field-${field.id}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                        
                        {field.type === 'dropdown' && (
                          <FormItem>
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            <Select onValueChange={(value) => handleFieldValueChange(field.id, value)}>
                              <FormControl>
                                <SelectTrigger data-testid={`field-${field.id}`}>
                                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {field.options?.map((option: string) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                        
                        {field.type === 'textarea' && (
                          <FormItem>
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            <FormControl>
                              <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                data-testid={`field-${field.id}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                        
                        {field.type === 'date' && (
                          <FormItem>
                            <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                data-testid={`field-${field.id}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                        
                        {field.type === 'checkbox' && (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="w-4 h-4 mt-1"
                                onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                                data-testid={`field-${field.id}`}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{field.label} {field.required && <span className="text-destructive">*</span>}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="cancel-module-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="save-module-button"
                  >
                    Create Module
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by module ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-modules"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-64" data-testid="category-filter">
            <SelectValue placeholder="Filter by category" />
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
      </div>

      {/* Service Modules Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No service modules found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Create your first service module to get started.'}
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Service Module
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Module ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer / Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Next Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredModules.map((module) => (
                    <tr key={module.id} className="hover:bg-muted/25" data-testid={`module-row-${module.moduleId}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/service-modules/${module.id}`}>
                          <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                            {module.moduleId}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {getCustomerName(module.customerId)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getLocationName(module.locationId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(module.categoryId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(module.status, module.nextServiceDate ? new Date(module.nextServiceDate).toISOString() : undefined)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {module.nextServiceDate ? format(new Date(module.nextServiceDate), 'MMM d, yyyy') : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {getSupplierName(module.supplierId) || 'Not assigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <Link href={`/service-modules/${module.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`view-module-${module.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(module)}
                            data-testid={`delete-module-${module.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
