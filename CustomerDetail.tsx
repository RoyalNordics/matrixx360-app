import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, MapPin, Plus, Building, Phone, Mail, FileText, User, ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Customer, Location, InsertLocation, ServiceModule, ServiceCategory } from "@shared/schema";

// Location form schema for creating new locations
const locationFormSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  street: z.string().min(1, "Street is required"),
  streetNumber: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().min(1, "City is required"),
  mainPhone: z.string().optional(),
  category: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  mainContactName: z.string().optional(),
  mainContactEmail: z.string().email().optional().or(z.literal("")),
  mainContactPhone: z.string().optional(),
  mainContactRole: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationFormSchema>;

// Bulk location row interface
interface BulkLocationRow {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  mainContactName: string;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isBulkLocationDialogOpen, setIsBulkLocationDialogOpen] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [bulkLocationRows, setBulkLocationRows] = useState<BulkLocationRow[]>([
    { id: '1', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
    { id: '2', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
    { id: '3', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
  ]);
  const { toast } = useToast();

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['/api/customers', id],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/customers', id, '/locations'],
    enabled: !!id,
  });

  // Fetch all service modules for this customer
  const { data: serviceModulesResponse } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules', 'customer', id],
    queryFn: async () => {
      const response = await fetch(`/api/service-modules?customerId=${encodeURIComponent(id || '')}`);
      if (!response.ok) throw new Error('Failed to fetch service modules');
      return response.json();
    },
    enabled: !!id,
  });
  const serviceModules = serviceModulesResponse?.modules || [];

  // Fetch service categories for display names
  const { data: serviceCategories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  // Group service modules by location
  const serviceModulesByLocation = serviceModules.reduce((acc, module) => {
    if (!acc[module.locationId]) {
      acc[module.locationId] = [];
    }
    acc[module.locationId].push(module);
    return acc;
  }, {} as Record<string, ServiceModule[]>);

  // Helper to get category name
  const getCategoryName = (categoryId: string) => {
    const category = serviceCategories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Toggle location expansion
  const toggleLocationExpansion = (locationId: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  // Calculate total service modules
  const totalServiceModules = serviceModules.length;

  // Location creation mutation
  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      const response = await apiRequest('POST', '/api/locations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', id, '/locations'] });
      setIsLocationDialogOpen(false);
      toast({ title: "Success", description: "Location created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create location",
        variant: "destructive" 
      });
    },
  });

  // Bulk location creation mutation
  const createBulkLocationsMutation = useMutation({
    mutationFn: async (locations: InsertLocation[]) => {
      const response = await apiRequest('POST', '/api/locations/bulk', locations);
      const data = await response.json();
      
      // Check if response contains error (defensive check in case apiRequest doesn't throw)
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', id, '/locations'] });
      setIsBulkLocationDialogOpen(false);
      setBulkLocationRows([
        { id: '1', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
        { id: '2', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
        { id: '3', name: '', street: '', zipCode: '', city: '', mainContactName: '' },
      ]);
      toast({ 
        title: "Success", 
        description: `${Array.isArray(data) ? data.length : 0} locations created successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create locations",
        variant: "destructive" 
      });
    },
  });

  // Location form
  const locationForm = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: "",
      street: "",
      streetNumber: "",
      zipCode: "",
      city: "",
      mainPhone: "",
      category: "",
      gpsCoordinates: "",
      mainContactName: "",
      mainContactEmail: "",
      mainContactPhone: "",
      mainContactRole: "",
    },
  });

  const onLocationSubmit = (data: LocationFormData) => {
    if (id) {
      createLocationMutation.mutate({ ...data, customerId: id });
    }
  };

  // Bulk location helper functions
  const addBulkLocationRows = (count: number) => {
    const newRows = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      name: '',
      street: '',
      zipCode: '',
      city: '',
      mainContactName: '',
    }));
    setBulkLocationRows([...bulkLocationRows, ...newRows]);
  };

  const removeBulkLocationRow = (rowId: string) => {
    if (bulkLocationRows.length <= 1) {
      // Don't delete the last row, just reset it
      setBulkLocationRows([{ id: rowId, name: '', street: '', zipCode: '', city: '', mainContactName: '' }]);
    } else {
      setBulkLocationRows(bulkLocationRows.filter(row => row.id !== rowId));
    }
  };

  const updateBulkLocationRow = (rowId: string, field: keyof BulkLocationRow, value: string) => {
    setBulkLocationRows(bulkLocationRows.map(row =>
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  const onBulkLocationSubmit = () => {
    if (!id) return;

    // Filter out empty rows and validate
    const validRows = bulkLocationRows.filter(row => 
      row.name.trim() && row.street.trim() && row.city.trim()
    );

    if (validRows.length === 0) {
      toast({ 
        title: "Error", 
        description: "Please fill in at least one location with name, street, and city",
        variant: "destructive" 
      });
      return;
    }

    const locationsToCreate: InsertLocation[] = validRows.map(row => ({
      customerId: id,
      name: row.name,
      street: row.street,
      zipCode: row.zipCode || '',
      city: row.city,
      gpsCoordinates: '',
      mainContactName: row.mainContactName || '',
      mainContactEmail: '',
      mainContactPhone: '',
    }));

    createBulkLocationsMutation.mutate(locationsToCreate);
  };

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

  if (!customer) {
    return (
      <Layout title="Customer Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Customer not found</h3>
            <p className="text-muted-foreground mb-4">
              The customer you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/customers">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout 
      title={customer.name}
      subtitle={`Customer Details - ${locations.length} locations`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="add-location-header-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <Form {...locationForm}>
                <form onSubmit={locationForm.handleSubmit(onLocationSubmit)} className="space-y-4">
                  <FormField
                    control={locationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter location name" data-testid="location-name-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={locationForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter street address" data-testid="location-street-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationForm.control}
                      name="streetNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="No." data-testid="location-street-number-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={locationForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Zip code" data-testid="location-zipcode-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={locationForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter city" data-testid="location-city-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={locationForm.control}
                    name="mainPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+45 12345678" data-testid="location-main-phone-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={locationForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Office, Warehouse, Retail" data-testid="location-category-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3">Contact Person (Optional)</h3>
                    <div className="space-y-4">
                      <FormField
                        control={locationForm.control}
                        name="mainContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Contact person name" data-testid="location-contact-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={locationForm.control}
                          name="mainContactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="contact@example.com" data-testid="location-email-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={locationForm.control}
                          name="mainContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+45 12345678" data-testid="location-phone-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={locationForm.control}
                        name="mainContactRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Facility Manager" data-testid="location-contact-role-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLocationMutation.isPending} data-testid="save-location-button">
                      {createLocationMutation.isPending ? "Creating..." : "Create Location"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isBulkLocationDialogOpen} onOpenChange={setIsBulkLocationDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="bulk-add-locations-button">
                <Plus className="w-4 h-4 mr-2" />
                Bulk Add Locations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Add Business Units</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Quickly add multiple business units at once. Fill in the essential details below - you can complete additional information later.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Location Name *</th>
                        <th className="px-3 py-2 text-left font-medium">Street Address *</th>
                        <th className="px-3 py-2 text-left font-medium">Zip Code</th>
                        <th className="px-3 py-2 text-left font-medium">City *</th>
                        <th className="px-3 py-2 text-left font-medium">Contact Person</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkLocationRows.map((row, index) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-2 py-2">
                            <Input
                              value={row.name}
                              onChange={(e) => updateBulkLocationRow(row.id, 'name', e.target.value)}
                              placeholder="Building name"
                              className="h-9"
                              data-testid={`bulk-location-name-${index}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={row.street}
                              onChange={(e) => updateBulkLocationRow(row.id, 'street', e.target.value)}
                              placeholder="Street address"
                              className="h-9"
                              data-testid={`bulk-location-street-${index}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={row.zipCode}
                              onChange={(e) => updateBulkLocationRow(row.id, 'zipCode', e.target.value)}
                              placeholder="Zip"
                              className="h-9"
                              data-testid={`bulk-location-zip-${index}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={row.city}
                              onChange={(e) => updateBulkLocationRow(row.id, 'city', e.target.value)}
                              placeholder="City"
                              className="h-9"
                              data-testid={`bulk-location-city-${index}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={row.mainContactName}
                              onChange={(e) => updateBulkLocationRow(row.id, 'mainContactName', e.target.value)}
                              placeholder="Contact"
                              className="h-9"
                              data-testid={`bulk-location-contact-${index}`}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkLocationRow(row.id)}
                              className="h-9 w-9 p-0"
                              disabled={bulkLocationRows.length <= 1}
                              data-testid={`remove-bulk-location-${index}`}
                            >
                              ×
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBulkLocationRows(3)}
                      data-testid="add-3-rows-button"
                    >
                      + Add 3 Rows
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBulkLocationRows(5)}
                      data-testid="add-5-rows-button"
                    >
                      + Add 5 Rows
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsBulkLocationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={onBulkLocationSubmit}
                      disabled={createBulkLocationsMutation.isPending || bulkLocationRows.filter(r => r.name && r.street && r.city).length === 0}
                      data-testid="create-all-locations-button"
                    >
                      {createBulkLocationsMutation.isPending ? "Creating..." : `Create All (${bulkLocationRows.filter(r => r.name && r.street && r.city).length})`}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content with Tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="customer-info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer-info" className="flex items-center space-x-2" data-testid="customer-info-tab">
                <User className="w-4 h-4" />
                <span>Customer Info</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center space-x-2" data-testid="locations-tab">
                <MapPin className="w-4 h-4" />
                <span>Locations ({locations.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Customer Info Tab */}
            <TabsContent value="customer-info" className="space-y-6 mt-6">
              
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                      <p className="text-foreground font-medium" data-testid="customer-name">
                        {customer.name}
                      </p>
                    </div>
                    {customer.cvrNumber && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">CVR Number</Label>
                        <p className="text-foreground" data-testid="customer-cvr">
                          {customer.cvrNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.street && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="text-foreground">
                          {customer.streetNumber && `${customer.streetNumber} `}{customer.street}
                          {customer.city && `, ${customer.zipCode} ${customer.city}`}
                        </p>
                      </div>
                    )}
                    {customer.category && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                        <p className="text-foreground">{customer.category}</p>
                      </div>
                    )}
                  </div>

                  {customer.mainPhone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Main Phone</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{customer.mainPhone}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Main Contact */}
              {(customer.mainContactName || customer.mainContactEmail || customer.mainContactPhone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Main Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customer.mainContactName && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                        <p className="text-foreground font-medium">{customer.mainContactName}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.mainContactEmail && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{customer.mainContactEmail}</span>
                        </div>
                      )}
                      {customer.mainContactPhone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{customer.mainContactPhone}</span>
                        </div>
                      )}
                    </div>

                    {customer.mainContactRole && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <p className="text-foreground">{customer.mainContactRole}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}


            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Locations ({locations.length})
                    </CardTitle>
                    <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="add-location-tab-button">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Location
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {locations.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No locations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add locations where this customer has facilities or services.
                      </p>
                      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="add-first-location-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Location
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {locations.map((location) => {
                        const locationModules = serviceModulesByLocation[location.id] || [];
                        const moduleCount = locationModules.length;
                        const isExpanded = expandedLocations.has(location.id);
                        
                        return (
                          <Collapsible
                            key={location.id}
                            open={isExpanded}
                            onOpenChange={() => toggleLocationExpansion(location.id)}
                          >
                            <div 
                              className="border border-border rounded-lg overflow-hidden"
                              data-testid={`location-${location.id}`}
                            >
                              {/* Location Header */}
                              <div className="p-4 hover:bg-accent/50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-foreground">{location.name}</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {location.street}, {location.zipCode} {location.city}
                                    </p>
                                    {location.mainContactName && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Contact: {location.mainContactName}
                                        {location.mainContactEmail && ` (${location.mainContactEmail})`}
                                        {location.mainContactPhone && ` - ${location.mainContactPhone}`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {moduleCount > 0 && (
                                      <CollapsibleTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          data-testid={`toggle-modules-${location.id}`}
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className="w-4 h-4" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </CollapsibleTrigger>
                                    )}
                                    <Link href={`/locations/${location.id}`}>
                                      <Button variant="outline" size="sm" data-testid={`view-location-details-${location.id}`}>
                                        View Details
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Service Modules Preview */}
                              <CollapsibleContent>
                                {moduleCount > 0 && (
                                  <div className="border-t border-border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Wrench className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-muted-foreground">Service Modules</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {locationModules.map((module) => (
                                        <Link key={module.id} href={`/service-modules/${module.id}`}>
                                          <div 
                                            className="flex items-center gap-2 p-2 rounded-md bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                                            data-testid={`service-module-preview-${module.id}`}
                                          >
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">
                                                {module.moduleId}
                                              </p>
                                              <p className="text-xs text-muted-foreground truncate">
                                                {getCategoryName(module.categoryId)}
                                              </p>
                                            </div>
                                            <Badge 
                                              variant={module.status === 'active' ? 'default' : 'secondary'}
                                              className="text-xs shrink-0"
                                            >
                                              {module.status}
                                            </Badge>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Quick Stats & Actions */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Locations</span>
                <Badge variant="secondary" data-testid="locations-count">
                  {locations.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Modules</span>
                <Badge variant="secondary" data-testid="service-modules-count">
                  {totalServiceModules}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Services</span>
                <Badge variant="secondary" data-testid="active-services-count">
                  {serviceModules.filter(m => m.status === 'active').length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm" data-testid="quick-add-location-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Create Service Module
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Building className="w-4 h-4 mr-2" />
                View All Services
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

