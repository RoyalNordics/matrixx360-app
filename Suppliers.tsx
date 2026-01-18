import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, Building, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import type { Supplier, ServiceCategory, InsertSupplier, ContactPerson } from "@shared/schema";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  cvrNumber: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  qualityRating: z.string().optional(),
  priceRating: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest('POST', '/api/suppliers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Supplier created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create supplier",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertSupplier> }) => {
      const response = await apiRequest('PUT', `/api/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setEditingSupplier(null);
      resetForm();
      toast({ title: "Success", description: "Supplier updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update supplier",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({ title: "Success", description: "Supplier deactivated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to deactivate supplier",
        variant: "destructive" 
      });
    },
  });

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      cvrNumber: "",
      address: "",
      email: "",
      phone: "",
      categories: [],
      qualityRating: "",
      priceRating: "",
      notes: "",
    },
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.cvrNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           (Array.isArray(supplier.categories) && supplier.categories.includes(selectedCategory));
    
    return matchesSearch && matchesCategory && supplier.isActive;
  });

  const onSubmit = (data: SupplierFormData) => {
    const supplierData: InsertSupplier = {
      ...data,
      categories: data.categories,
      qualityRating: data.qualityRating ? data.qualityRating : "0",
      priceRating: data.priceRating ? data.priceRating : "0",
      contactPersons: [], // Will be added later in detail view
      documents: [],
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: supplierData });
    } else {
      createMutation.mutate(supplierData);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      cvrNumber: supplier.cvrNumber || "",
      address: supplier.address || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      categories: Array.isArray(supplier.categories) ? supplier.categories : [],
      qualityRating: supplier.qualityRating || "0",
      priceRating: supplier.priceRating || "0",
      notes: supplier.notes || "",
    });
  };

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`Are you sure you want to deactivate ${supplier.name}?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    form.reset({
      name: "",
      cvrNumber: "",
      address: "",
      email: "",
      phone: "",
      categories: [],
      qualityRating: "",
      priceRating: "",
      notes: "",
    });
  };

  const getCategoryNames = (categoryIds: string[] | undefined) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return [];
    return categoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category?.name || 'Unknown Category';
    });
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#3B82F6';
  };

  const renderRating = (rating: string | null) => {
    const numRating = parseFloat(rating || '0');
    if (numRating === 0) return <span className="text-muted-foreground">Not rated</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < numRating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({numRating})</span>
      </div>
    );
  };

  return (
    <Layout 
      title="Suppliers" 
      subtitle={`${suppliers.filter(s => s.isActive).length} active suppliers`}
      actions={
        <Dialog 
          open={isCreateDialogOpen || !!editingSupplier} 
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
              data-testid="add-supplier-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="supplier-name-input" />
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
                        <Input {...field} data-testid="supplier-cvr-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="supplier-address-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="supplier-email-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="supplier-phone-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Service Categories</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(field.value?.filter((value) => value !== category.id))
                                    }}
                                    data-testid={`category-${category.id}-checkbox`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {category.name}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="qualityRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" max="5" step="0.1" data-testid="quality-rating-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" max="5" step="0.1" data-testid="price-rating-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="supplier-notes-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="cancel-supplier-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="save-supplier-button"
                  >
                    {editingSupplier ? 'Update' : 'Create'} Supplier
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
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-suppliers"
          />
        </div>
        
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background"
          data-testid="category-filter"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Suppliers Grid */}
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
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No suppliers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first supplier.'}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow" data-testid={`supplier-card-${supplier.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-2" data-testid={`supplier-name-${supplier.id}`}>
                      {supplier.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {getCategoryNames(supplier.categories as string[]).map((categoryName, index) => {
                        const categoryId = Array.isArray(supplier.categories) ? supplier.categories[index] : '';
                        return (
                          <Badge 
                            key={index}
                            style={{ 
                              backgroundColor: `${getCategoryColor(categoryId)}20`, 
                              color: getCategoryColor(categoryId) 
                            }}
                            className="border-0 text-xs"
                          >
                            {categoryName}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      data-testid={`edit-supplier-${supplier.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supplier)}
                      data-testid={`delete-supplier-${supplier.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {supplier.address && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="w-4 h-4 mr-2" />
                      {supplier.address}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      {supplier.phone}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Quality:</span>
                      {renderRating(supplier.qualityRating)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Price:</span>
                      {renderRating(supplier.priceRating)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link href={`/suppliers/${supplier.id}`}>
                    <Button variant="outline" size="sm" className="w-full" data-testid={`view-supplier-${supplier.id}`}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
