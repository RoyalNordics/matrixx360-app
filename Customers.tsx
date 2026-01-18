import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Building, Phone, Mail, Users, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { Customer, InsertCustomer, InsertLocation, ContractType } from "@shared/schema";
import { insertLocationSchema } from "@shared/schema";

const customerFormSchema = z.object({
  // Basic customer information
  name: z.string().min(1, "Name is required"),
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  mainPhone: z.string().optional(),
  category: z.string().optional(),
  cvrNumber: z.string().optional(),
  
  // Main contact information
  mainContactName: z.string().optional(),
  mainContactEmail: z.string().email().optional().or(z.literal("")),
  mainContactPhone: z.string().optional(),
  mainContactRole: z.string().optional(),
  
  // Contract type
  contractTypeId: z.string().optional(),
  
  // Legacy fields
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: contractTypes = [] } = useQuery<ContractType[]>({
    queryKey: ['/api/contract-types'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest('POST', '/api/customers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Customer created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create customer",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertCustomer> }) => {
      const response = await apiRequest('PUT', `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setEditingCustomer(null);
      toast({ title: "Success", description: "Customer updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update customer",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "Success", description: "Customer deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete customer",
        variant: "destructive" 
      });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertLocation) => {
      const response = await apiRequest('POST', '/api/locations', data);
      return response.json();
    },
  });

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      // Basic customer information
      name: "",
      street: "",
      streetNumber: "",
      city: "",
      zipCode: "",
      mainPhone: "",
      category: "",
      cvrNumber: "",
      
      // Main contact information
      mainContactName: "",
      mainContactEmail: "",
      mainContactPhone: "",
      mainContactRole: "",
      
      // Contract type
      contractTypeId: "",
      
      // Legacy fields
      notes: "",
    },
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mainContactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cvrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: CustomerFormData) => {
    const preparedData = {
      ...data,
      contractTypeId: data.contractTypeId || null,
    };
    
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: preparedData });
    } else {
      createMutation.mutate(preparedData);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      // Basic customer information
      name: customer.name,
      street: customer.street || "",
      streetNumber: customer.streetNumber || "",
      city: customer.city || "",
      zipCode: customer.zipCode || "",
      mainPhone: customer.mainPhone || "",
      category: customer.category || "",
      cvrNumber: customer.cvrNumber || "",
      
      // Main contact information
      mainContactName: customer.mainContactName || "",
      mainContactEmail: customer.mainContactEmail || "",
      mainContactPhone: customer.mainContactPhone || "",
      mainContactRole: customer.mainContactRole || "",
      
      // Contract type
      contractTypeId: customer.contractTypeId || "",
      
      // Legacy fields
      notes: customer.notes || "",
    });
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    form.reset({
      // Basic customer information
      name: "",
      street: "",
      streetNumber: "",
      city: "",
      zipCode: "",
      mainPhone: "",
      category: "",
      cvrNumber: "",
      
      // Main contact information
      mainContactName: "",
      mainContactEmail: "",
      mainContactPhone: "",
      mainContactRole: "",
      
      // Contract type
      contractTypeId: "",
      
      // Legacy fields
      notes: "",
    });
  };

  const handleAddBusinessUnit = async (customerId: string, customerName: string) => {
    // Create a basic location for this customer
    const locationData: InsertLocation = {
      customerId: customerId,
      name: `${customerName} - Main Location`,
      street: '',
      streetNumber: '',
      city: '',
      zipCode: '',
      mainPhone: '',
      category: '',
      mainContactName: '',
      mainContactEmail: '',
      mainContactPhone: '',
      mainContactRole: '',
      numberOfDishes: 0,
      numberOfCanteenUsers: 0,
      mealSizeGrams: 0,
      costPerMeal: null,
      vegetarian: false,
      organic: false,
      fastFood: false,
      warm: false,
      nutritionalInfo: [],
      organicProductsPercentage: 0,
      earningsModel: '',
      costPlusLevel: '',
      bonusModels: [],
      kpisMeasured: '',
      agreedLevel: '',
      gpsCoordinates: '',
      notes: '',
    };
    
    try {
      const newLocation = await createLocationMutation.mutateAsync(locationData);
      if (newLocation?.id) {
        setLocation(`/locations/${newLocation.id}`);
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        toast({ title: "Success", description: "Location created successfully" });
      } else {
        toast({ 
          title: "Error", 
          description: "Location created but navigation failed - missing ID",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create location",
        variant: "destructive" 
      });
    }
  };

  return (
    <Layout 
      title="Customers" 
      subtitle={`${customers.length} total customers`}
      actions={
        <Dialog 
          open={isCreateDialogOpen || !!editingCustomer} 
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="add-customer-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{editingCustomer ? 'Edit Customer' : 'Customer details'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Customer Details Section */}
                <Card className="bg-orange-50">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Company name" data-testid="customer-name-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Street name" data-testid="customer-street-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="No." data-testid="customer-street-number-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City name" data-testid="customer-city-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Postal code" data-testid="customer-zip-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mainPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Main Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Phone number" data-testid="customer-main-phone-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Office, Warehouse" data-testid="customer-category-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cvrNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVR Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Company registration" data-testid="customer-cvr-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground">Main Contact Person</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="mainContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Contact name" data-testid="main-contact-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mainContactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="email@example.com" data-testid="main-contact-email-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mainContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Phone number" data-testid="main-contact-phone-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mainContactRole"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Manager" data-testid="main-contact-role-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Unit Management */}
                {editingCustomer && (
                  <Card className="bg-orange-50">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Business Unit Management</h3>
                        <p className="text-muted-foreground mb-4">
                          Business units and contact persons are now managed per location for better organization.
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="bg-orange-200" 
                          onClick={() => handleAddBusinessUnit(editingCustomer.id, editingCustomer.name)}
                          disabled={createLocationMutation.isPending}
                          data-testid="add-business-unit-button"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {createLocationMutation.isPending ? "Creating..." : "Add Business Unit"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Contract Type */}
                <Card className="bg-orange-50">
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="contractTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="contract-type-select">
                                <SelectValue placeholder="Select a contract type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contractTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="cancel-customer-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="save-customer-button"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-customers"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`customer-card-${customer.id}`}>
              <Link href={`/customers/${customer.id}`} className="block">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-1" data-testid={`customer-name-${customer.id}`}>
                        {customer.name}
                      </h3>
                      {customer.cvrNumber && (
                        <p className="text-sm text-muted-foreground">CVR: {customer.cvrNumber}</p>
                      )}
                    </div>
                    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(customer);
                        }}
                        data-testid={`edit-customer-${customer.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(customer);
                        }}
                        data-testid={`delete-customer-${customer.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {customer.mainContactName && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium">{customer.mainContactName}</span>
                      </div>
                    )}
                    {customer.mainContactEmail && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 mr-2" />
                        {customer.mainContactEmail}
                      </div>
                    )}
                    {customer.mainContactPhone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 mr-2" />
                        {customer.mainContactPhone}
                      </div>
                    )}
                  </div>

                  {customer.notes && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {customer.notes}
                    </p>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
