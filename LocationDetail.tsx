import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, MapPin, Plus, Building, Phone, Mail, FileText, Users, Edit, Trash2, Wrench, Calendar, User, Package } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location, Customer, ServiceModule, ContactPerson, InsertContactPerson, InsertServiceModule, ServiceCategory, ServiceTemplate } from "@shared/schema";
import { insertContactPersonSchema, insertServiceModuleSchema } from "@shared/schema";

// Template count interface for bulk creation
interface TemplateCount {
  templateId: string;
  templateName: string;
  categoryId: string;
  categoryName: string;
  count: number;
}

export default function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isServiceModuleDialogOpen, setIsServiceModuleDialogOpen] = useState(false);
  const [isBulkModuleDialogOpen, setIsBulkModuleDialogOpen] = useState(false);
  const [templateCounts, setTemplateCounts] = useState<TemplateCount[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);

  const { data: location, isLoading } = useQuery<Location>({
    queryKey: ['/api/locations', id],
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ['/api/customers', location?.customerId],
    enabled: !!location?.customerId,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<ContactPerson[]>({
    queryKey: ['/api/locations', id, 'contacts'],
    enabled: !!id,
  });

  const { data: moduleData } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules', 'byLocation', id],
    queryFn: () => fetch(`/api/service-modules?locationId=${id}`).then(res => res.json()),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/service-categories'],
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/service-templates'],
  });

  const { data: suppliers } = useQuery({
    queryKey: ['/api/suppliers'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const contactForm = useForm<InsertContactPerson>({
    resolver: zodResolver(insertContactPersonSchema),
    defaultValues: {
      locationId: id || '',
      name: '',
      email: '',
      phone: '',
      role: '',
    },
  });

  const serviceModuleForm = useForm<InsertServiceModule>({
    resolver: zodResolver(insertServiceModuleSchema),
    defaultValues: {
      customerId: location?.customerId || '',
      locationId: id || '',
      templateId: '',
      categoryId: '',
      supplierId: '',
      responsibleUserId: '',
      fieldValues: {},
      documents: [],
      nextServiceDate: undefined,
      lastServiceDate: undefined,
      status: 'active',
      notes: '',
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (data: InsertContactPerson) => apiRequest('POST', '/api/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations', id, 'contacts'] });
      contactForm.reset();
      toast({ title: "Contact person created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        title: "Error creating contact person",
        description: error.message || "Failed to create contact person"
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => apiRequest('DELETE', `/api/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations', id, 'contacts'] });
      toast({ title: "Contact person deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        title: "Error deleting contact person",
        description: error.message || "Failed to delete contact person"
      });
    },
  });

  const createServiceModuleMutation = useMutation({
    mutationFn: (data: InsertServiceModule) => apiRequest('POST', '/api/service-modules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules', 'byLocation', id] });
      serviceModuleForm.reset();
      setIsServiceModuleDialogOpen(false);
      toast({ title: "Service modul oprettet" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        title: "Fejl ved oprettelse",
        description: error.message || "Kunne ikke oprette service modul"
      });
    },
  });

  const createBulkServiceModulesMutation = useMutation({
    mutationFn: async (modules: InsertServiceModule[]) => {
      const response = await apiRequest('POST', '/api/service-modules/bulk', modules);
      const data = await response.json();
      
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules', 'byLocation', id] });
      setIsBulkModuleDialogOpen(false);
      setTemplateCounts([]);
      toast({ 
        title: "Succes", 
        description: `${Array.isArray(data) ? data.length : 0} service moduler oprettet` 
      });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive",
        title: "Fejl", 
        description: error.message || "Kunne ikke oprette service moduler" 
      });
    },
  });

  const updateServiceModuleMutation = useMutation({
    mutationFn: async ({ moduleId, data }: { moduleId: string; data: Partial<InsertServiceModule> }) => {
      const response = await apiRequest('PATCH', `/api/service-modules/${moduleId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules', 'byLocation', id] });
      setIsEditModuleDialogOpen(false);
      setEditingModuleId(null);
      toast({ title: "Service modul opdateret" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Fejl ved opdatering",
        description: error.message || "Kunne ikke opdatere service modul"
      });
    },
  });

  const deleteServiceModuleMutation = useMutation({
    mutationFn: (moduleId: string) => apiRequest('DELETE', `/api/service-modules/${moduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules', 'byLocation', id] });
      toast({ title: "Service modul slettet" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Fejl ved sletning",
        description: error.message || "Kunne ikke slette service modul"
      });
    },
  });

  // Initialize template counts when bulk dialog opens
  const initializeTemplateCounts = () => {
    if (!templates || !categories) return;
    
    const counts: TemplateCount[] = (templates as ServiceTemplate[]).map(template => {
      const category = (categories as ServiceCategory[]).find(c => c.id === template.categoryId);
      return {
        templateId: template.id,
        templateName: template.templateName,
        categoryId: template.categoryId,
        categoryName: category?.name || 'Ukendt',
        count: 0,
      };
    });
    
    setTemplateCounts(counts);
  };

  const updateTemplateCount = (templateId: string, count: number) => {
    setTemplateCounts(prev => 
      prev.map(tc => tc.templateId === templateId ? { ...tc, count: Math.max(0, count) } : tc)
    );
  };

  const onBulkModuleSubmit = () => {
    if (!location?.customerId || !id) return;
    
    const modulesToCreate: InsertServiceModule[] = [];
    
    templateCounts.forEach(tc => {
      for (let i = 0; i < tc.count; i++) {
        modulesToCreate.push({
          customerId: location.customerId,
          locationId: id,
          templateId: tc.templateId,
          categoryId: tc.categoryId,
          fieldValues: {},
          documents: [],
          status: 'active',
        });
      }
    });
    
    if (modulesToCreate.length > 0) {
      createBulkServiceModulesMutation.mutate(modulesToCreate);
    }
  };

  const onCreateContact = (data: InsertContactPerson) => {
    createContactMutation.mutate({ ...data, locationId: id! });
  };

  const onCreateServiceModule = (data: InsertServiceModule) => {
    createServiceModuleMutation.mutate({ 
      ...data, 
      customerId: location?.customerId!, 
      locationId: id! 
    });
  };

  const handleDeleteContact = (contactId: string, contactName: string) => {
    if (confirm(`Are you sure you want to delete ${contactName}?`)) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleDeleteModule = (moduleId: string, moduleName: string) => {
    if (confirm(`Er du sikker på at du vil slette ${moduleName}?`)) {
      deleteServiceModuleMutation.mutate(moduleId);
    }
  };

  const getTemplateName = (templateId: string) => {
    if (!Array.isArray(templates)) return 'Ukendt skabelon';
    const template = templates.find((t: any) => t.id === templateId);
    return template?.templateName || 'Ukendt skabelon';
  };

  const getSupplierName = (supplierId: string | null | undefined) => {
    if (!supplierId || !Array.isArray(suppliers)) return null;
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    return supplier?.name || null;
  };

  const getUserName = (userId: string | null | undefined) => {
    if (!userId || !Array.isArray(users)) return null;
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : null;
  };

  const getModuleStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return null;
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // useMemo must be called before any early returns
  const moduleCategories = useMemo(() => {
    if (!moduleData?.modules || !Array.isArray(categories)) return [];
    
    // Group modules by category
    const categoryMap = new Map();
    
    moduleData.modules.forEach(module => {
      const category = categories.find((c: ServiceCategory) => c.id === module.categoryId);
      if (category) {
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            category,
            modules: []
          });
        }
        categoryMap.get(category.id).modules.push(module);
      }
    });
    
    return Array.from(categoryMap.values());
  }, [moduleData?.modules, categories]);

  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-48 bg-muted rounded"></div>
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout title="Location Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Location not found</h3>
            <p className="text-muted-foreground mb-4">
              The location you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/locations">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Locations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const getCategoryBadge = (categoryId: string) => {
    const category = Array.isArray(categories) ? categories.find((c: ServiceCategory) => c.id === categoryId) : null;
    if (!category) return null;
    
    return (
      <Badge 
        style={{ backgroundColor: `${category.color || '#000'}20`, color: category.color || '#000' }}
        className="border-0"
      >
        {category.name}
      </Badge>
    );
  };

  return (
    <Layout 
      title={location.name}
      subtitle={`Lokationsdetaljer - ${moduleData?.total || 0} service moduler`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/locations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbage til Lokationer
            </Button>
          </Link>
          <Dialog open={isServiceModuleDialogOpen} onOpenChange={setIsServiceModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="add-service-module-button">
                <Plus className="w-4 h-4 mr-2" />
                Tilføj Service Modul
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tilføj Service Modul</DialogTitle>
              </DialogHeader>
              
              <Form {...serviceModuleForm}>
                <form onSubmit={serviceModuleForm.handleSubmit(onCreateServiceModule)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceModuleForm.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skabelon</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vælg skabelon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(templates) && templates.map((template: any) => (
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
                      control={serviceModuleForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vælg kategori" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(categories) && categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={serviceModuleForm.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Leverandør (Valgfrit)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vælg leverandør" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
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
                      control={serviceModuleForm.control}
                      name="responsibleUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ansvarlig Bruger (Valgfrit)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vælg bruger" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(users) && users.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={serviceModuleForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Noter (Valgfrit)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tilføj noter..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsServiceModuleDialogOpen(false)}
                    >
                      Annuller
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createServiceModuleMutation.isPending}
                      data-testid="create-service-module-submit"
                    >
                      {createServiceModuleMutation.isPending ? "Opretter..." : "Opret Service Modul"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isBulkModuleDialogOpen} onOpenChange={(open) => {
            setIsBulkModuleDialogOpen(open);
            if (open) initializeTemplateCounts();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="bulk-add-modules-button">
                <Plus className="w-4 h-4 mr-2" />
                Massetilføj Moduler
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Massetilføj Service Moduler</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Opret hurtigt flere service moduler ved at vælge hvor mange af hver type du har brug for. Du kan udfylde detaljerede specifikationer senere.
                </p>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {templateCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Ingen service skabeloner tilgængelige. Opret skabeloner først.
                  </p>
                ) : (
                  <div className="overflow-y-auto pr-2 space-y-3 flex-1" data-testid="service-templates-list">
                    {Object.entries(
                      templateCounts.reduce((acc, tc) => {
                        if (!acc[tc.categoryName]) {
                          acc[tc.categoryName] = [];
                        }
                        acc[tc.categoryName].push(tc);
                        return acc;
                      }, {} as Record<string, TemplateCount[]>)
                    ).map(([categoryName, templates]) => (
                      <div key={categoryName} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-sm mb-3 text-foreground">{categoryName}</h3>
                        <div className="space-y-2">
                          {templates.map((tc) => (
                            <div key={tc.templateId} className="flex items-center justify-between">
                              <Label htmlFor={`template-${tc.templateId}`} className="text-sm">
                                {tc.templateName}
                              </Label>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateTemplateCount(tc.templateId, tc.count - 1)}
                                  disabled={tc.count === 0}
                                  data-testid={`decrease-${tc.templateId}`}
                                >
                                  -
                                </Button>
                                <Input
                                  id={`template-${tc.templateId}`}
                                  type="number"
                                  min="0"
                                  value={tc.count}
                                  onChange={(e) => updateTemplateCount(tc.templateId, parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  data-testid={`count-${tc.templateId}`}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => updateTemplateCount(tc.templateId, tc.count + 1)}
                                  data-testid={`increase-${tc.templateId}`}
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 mt-4">
                <p className="text-sm text-muted-foreground">
                  Moduler at oprette: <span className="font-semibold text-foreground">
                    {templateCounts.reduce((sum, tc) => sum + tc.count, 0)}
                  </span>
                </p>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsBulkModuleDialogOpen(false)}
                  >
                    Annuller
                  </Button>
                  <Button 
                    onClick={onBulkModuleSubmit}
                    disabled={createBulkServiceModulesMutation.isPending || templateCounts.reduce((sum, tc) => sum + tc.count, 0) === 0}
                    data-testid="create-bulk-modules-button"
                  >
                    {createBulkServiceModulesMutation.isPending ? "Opretter..." : `Opret ${templateCounts.reduce((sum, tc) => sum + tc.count, 0)} Moduler`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Location Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Location Name</Label>
                <p className="text-foreground font-medium" data-testid="location-name">
                  {location.name}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                <p className="text-foreground font-medium" data-testid="customer-name">
                  {customer?.name || 'Loading...'}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-foreground" data-testid="location-address">
                  {[location.street, location.streetNumber].filter(Boolean).join(' ')}
                </p>
                <p className="text-foreground">
                  {location.zipCode} {location.city}
                </p>
              </div>

              {location.mainPhone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Main Phone</Label>
                  <p className="text-foreground" data-testid="location-main-phone">
                    {location.mainPhone}
                  </p>
                </div>
              )}

              {location.category && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="text-foreground" data-testid="location-category">
                    {location.category}
                  </p>
                </div>
              )}

              {location.gpsCoordinates && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">GPS Coordinates</Label>
                  <p className="text-foreground font-mono text-sm" data-testid="gps-coordinates">
                    {location.gpsCoordinates}
                  </p>
                </div>
              )}

              {(location.mainContactName || location.mainContactEmail || location.mainContactPhone || location.mainContactRole) && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Local Contact</Label>
                  {location.mainContactName && (
                    <p className="text-foreground font-medium mb-1" data-testid="contact-person">
                      {location.mainContactName}
                      {location.mainContactRole && (
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                          ({location.mainContactRole})
                        </span>
                      )}
                    </p>
                  )}
                  <div className="flex flex-col space-y-1">
                    {location.mainContactEmail && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 mr-2" />
                        <span data-testid="contact-email">{location.mainContactEmail}</span>
                      </div>
                    )}
                    {location.mainContactPhone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        <span data-testid="contact-phone">{location.mainContactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Persons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Contact Persons ({contacts?.length || 0})
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="add-contact-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Contact Person</DialogTitle>
                    </DialogHeader>
                    <Form {...contactForm}>
                      <form onSubmit={contactForm.handleSubmit(onCreateContact)} className="space-y-4">
                        <FormField
                          control={contactForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Contact person name" data-testid="contact-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="contact@company.com" data-testid="contact-email-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="+45 12 34 56 78" data-testid="contact-phone-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Manager, Chef, Technician, etc." data-testid="contact-role-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogTrigger>
                          <Button 
                            type="submit" 
                            disabled={createContactMutation.isPending}
                            data-testid="save-contact-button"
                          >
                            {createContactMutation.isPending ? "Saving..." : "Save Contact"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="text-center py-4">Loading contacts...</div>
              ) : !contacts || contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No contact persons yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add contact persons to manage communication for this location.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`contact-card-${contact.id}`}>
                      <div>
                        <h4 className="font-medium text-foreground" data-testid={`contact-name-${contact.id}`}>
                          {contact.name}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid={`contact-role-${contact.id}`}>
                          {contact.role}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="w-4 h-4 mr-1" />
                            <span data-testid={`contact-email-${contact.id}`}>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-4 h-4 mr-1" />
                              <span data-testid={`contact-phone-${contact.id}`}>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`edit-contact-${contact.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          disabled={deleteContactMutation.isPending}
                          data-testid={`delete-contact-${contact.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Modules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Service Moduler ({moduleData?.total || 0})
                </CardTitle>
                <Button 
                  size="sm" 
                  data-testid="add-module-button"
                  onClick={() => setIsServiceModuleDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tilføj Modul
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!moduleData?.modules || moduleData.modules.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Ingen service moduler endnu</h3>
                  <p className="text-muted-foreground mb-4">
                    Tilføj service moduler for at tracke vedligeholdelse og compliance for denne lokation.
                  </p>
                  <Button onClick={() => setIsServiceModuleDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tilføj Første Modul
                  </Button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-3">
                  {moduleData.modules.map((module) => {
                    const category = Array.isArray(categories) 
                      ? categories.find((c: ServiceCategory) => c.id === module.categoryId) 
                      : null;
                    const isOverdue = module.nextServiceDate && new Date(module.nextServiceDate) < new Date();
                    
                    return (
                      <AccordionItem 
                        key={module.id} 
                        value={module.id}
                        className="border rounded-lg px-4 data-[state=open]:bg-accent/30"
                        data-testid={`module-card-${module.id}`}
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground" data-testid={`module-id-${module.id}`}>
                                    {module.moduleId}
                                  </span>
                                  <Badge className={getModuleStatusColor(isOverdue ? 'overdue' : module.status)}>
                                    {isOverdue ? 'Forsinket' : module.status === 'active' ? 'Aktiv' : module.status}
                                  </Badge>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {getTemplateName(module.templateId)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {category && (
                                <Badge 
                                  style={{ backgroundColor: `${category.color || '#6b7280'}20`, color: category.color || '#6b7280' }}
                                  className="border-0 hidden sm:inline-flex"
                                >
                                  {category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="space-y-4 pt-2">
                            {/* Module Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Kategori:</span>
                                  <span className="font-medium">{category?.name || 'Ikke angivet'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Wrench className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Skabelon:</span>
                                  <span className="font-medium">{getTemplateName(module.templateId)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Lokation:</span>
                                  <span className="font-medium">{location.name}</span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {getSupplierName(module.supplierId) && (
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Leverandør:</span>
                                    <span className="font-medium">{getSupplierName(module.supplierId)}</span>
                                  </div>
                                )}
                                {getUserName(module.responsibleUserId) && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Ansvarlig:</span>
                                    <span className="font-medium">{getUserName(module.responsibleUserId)}</span>
                                  </div>
                                )}
                                {module.nextServiceDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Næste service:</span>
                                    <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                                      {formatDate(module.nextServiceDate)}
                                    </span>
                                  </div>
                                )}
                                {module.lastServiceDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Sidste service:</span>
                                    <span className="font-medium">{formatDate(module.lastServiceDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {module.notes && (
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Noter:</p>
                                <p className="text-sm">{module.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingModuleId(module.id);
                                  setIsEditModuleDialogOpen(true);
                                }}
                                data-testid={`edit-module-${module.id}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Rediger
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(module.id, module.moduleId);
                                }}
                                disabled={deleteServiceModuleMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                data-testid={`delete-module-${module.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Slet
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Stats & Actions */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Oversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Moduler</span>
                <Badge variant="secondary" data-testid="modules-count">
                  {moduleData?.total || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aktive Services</span>
                <Badge variant="secondary">
                  {moduleData?.modules?.filter(m => m.status === 'active').length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Forsinkede Services</span>
                <Badge variant="destructive">
                  {moduleData?.modules?.filter(m => {
                    if (!m.nextServiceDate) return false;
                    return new Date(m.nextServiceDate) < new Date();
                  }).length || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hurtige Handlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => setIsServiceModuleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tilføj Service Modul
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Generer Rapport
              </Button>
              <Link href={customer ? `/customers/${customer.id}` : '#'}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Se Kundedetaljer
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Service Module Dialog */}
      <Dialog open={isEditModuleDialogOpen} onOpenChange={(open) => {
        setIsEditModuleDialogOpen(open);
        if (!open) setEditingModuleId(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rediger Service Modul</DialogTitle>
          </DialogHeader>
          {editingModuleId && (() => {
            const editModule = moduleData?.modules?.find(m => m.id === editingModuleId);
            if (!editModule) return null;
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Modul ID</Label>
                    <p className="font-medium">{editModule.moduleId}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <Select 
                      defaultValue={editModule.status}
                      onValueChange={(value) => {
                        updateServiceModuleMutation.mutate({
                          moduleId: editModule.id,
                          data: { status: value as 'active' | 'pending' | 'inactive' }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="pending">Afventer</SelectItem>
                        <SelectItem value="inactive">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Leverandør</Label>
                    <Select 
                      defaultValue={editModule.supplierId || "none"}
                      onValueChange={(value) => {
                        updateServiceModuleMutation.mutate({
                          moduleId: editModule.id,
                          data: { supplierId: value === "none" ? null : value }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg leverandør" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen leverandør</SelectItem>
                        {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Ansvarlig bruger</Label>
                    <Select 
                      defaultValue={editModule.responsibleUserId || "none"}
                      onValueChange={(value) => {
                        updateServiceModuleMutation.mutate({
                          moduleId: editModule.id,
                          data: { responsibleUserId: value === "none" ? null : value }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg bruger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen ansvarlig</SelectItem>
                        {Array.isArray(users) && users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Noter</Label>
                  <Textarea 
                    defaultValue={editModule.notes || ''}
                    placeholder="Tilføj noter..."
                    onBlur={(e) => {
                      if (e.target.value !== (editModule.notes || '')) {
                        updateServiceModuleMutation.mutate({
                          moduleId: editModule.id,
                          data: { notes: e.target.value }
                        });
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditModuleDialogOpen(false)}
                  >
                    Luk
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
