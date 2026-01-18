import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building, Phone, Mail, Star, Plus, Edit, Trash2, User } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Supplier, ServiceCategory, ContactPerson } from "@shared/schema";

const contactPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
});

type ContactPersonFormData = z.infer<typeof contactPersonSchema>;

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);

  const { data: supplier, isLoading } = useQuery<Supplier>({
    queryKey: ['/api/suppliers', id],
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  const { data: moduleData } = useQuery<{ modules: any[], total: number }>({
    queryKey: ['/api/service-modules', { supplierId: id }],
    enabled: !!id,
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: { contactPersons: ContactPerson[] }) => {
      const response = await apiRequest('PUT', `/api/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers', id] });
      setIsContactDialogOpen(false);
      setEditingContact(null);
      form.reset();
      toast({ title: "Success", description: "Contact person updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update contact person",
        variant: "destructive" 
      });
    },
  });

  const form = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: "",
    },
  });

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

  if (!supplier) {
    return (
      <Layout title="Supplier Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Supplier not found</h3>
            <p className="text-muted-foreground mb-4">
              The supplier you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/suppliers">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Suppliers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const contactPersons = (supplier.contactPersons as ContactPerson[]) || [];

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

  const getCategoryNames = (categoryIds: string[] | undefined) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return [];
    return categoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return { name: category?.name || 'Unknown Category', color: category?.color || '#3B82F6' };
    });
  };

  const onSubmitContact = (data: ContactPersonFormData) => {
    const newContact: ContactPerson = {
      name: data.name,
      phone: data.phone || "",
      email: data.email || "",
      role: data.role,
    };

    let updatedContacts: ContactPerson[];
    if (editingContact) {
      const editIndex = contactPersons.findIndex(c => 
        c.name === editingContact.name && c.email === editingContact.email
      );
      updatedContacts = [...contactPersons];
      updatedContacts[editIndex] = newContact;
    } else {
      updatedContacts = [...contactPersons, newContact];
    }

    updateSupplierMutation.mutate({ contactPersons: updatedContacts });
  };

  const handleEditContact = (contact: ContactPerson) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      role: contact.role,
    });
    setIsContactDialogOpen(true);
  };

  const handleDeleteContact = (contact: ContactPerson) => {
    if (confirm(`Are you sure you want to remove ${contact.name}?`)) {
      const updatedContacts = contactPersons.filter(c => 
        !(c.name === contact.name && c.email === contact.email)
      );
      updateSupplierMutation.mutate({ contactPersons: updatedContacts });
    }
  };

  const resetContactForm = () => {
    setEditingContact(null);
    form.reset({
      name: "",
      phone: "",
      email: "",
      role: "",
    });
  };

  return (
    <Layout 
      title={supplier.name}
      subtitle={`Supplier Details - ${moduleData?.total || 0} active service modules`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Suppliers
            </Button>
          </Link>
          <Button size="sm" data-testid="edit-supplier-button">
            <Edit className="w-4 h-4 mr-2" />
            Edit Supplier
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Supplier Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info */}
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
                  <p className="text-foreground font-medium" data-testid="supplier-name">
                    {supplier.name}
                  </p>
                </div>
                {supplier.cvrNumber && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CVR Number</Label>
                    <p className="text-foreground" data-testid="supplier-cvr">
                      {supplier.cvrNumber}
                    </p>
                  </div>
                )}
              </div>

              {supplier.address && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-foreground" data-testid="supplier-address">
                    {supplier.address}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground" data-testid="supplier-email">
                      {supplier.email}
                    </span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground" data-testid="supplier-phone">
                      {supplier.phone}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Service Categories</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {getCategoryNames(supplier.categories as string[]).map((cat, index) => (
                    <Badge 
                      key={index}
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      className="border-0"
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quality Rating</Label>
                  <div className="mt-1">
                    {renderRating(supplier.qualityRating)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Price Rating</Label>
                  <div className="mt-1">
                    {renderRating(supplier.priceRating)}
                  </div>
                </div>
              </div>

              {supplier.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-foreground text-sm" data-testid="supplier-notes">
                    {supplier.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Persons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Contact Persons ({contactPersons.length})
                </CardTitle>
                <Dialog 
                  open={isContactDialogOpen} 
                  onOpenChange={(open) => {
                    setIsContactDialogOpen(open);
                    if (!open) resetContactForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="add-contact-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingContact ? 'Edit Contact Person' : 'Add Contact Person'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitContact)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="contact-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. Account Manager" data-testid="contact-role-input" />
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
                                  <Input {...field} type="email" data-testid="contact-email-input" />
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
                                  <Input {...field} data-testid="contact-phone-input" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setIsContactDialogOpen(false);
                              resetContactForm();
                            }}
                            data-testid="cancel-contact-button"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateSupplierMutation.isPending}
                            data-testid="save-contact-button"
                          >
                            {editingContact ? 'Update' : 'Add'} Contact
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contactPersons.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No contact persons</h3>
                  <p className="text-muted-foreground mb-4">
                    Add contact persons to manage communication with this supplier.
                  </p>
                  <Button onClick={() => setIsContactDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactPersons.map((contact, index) => (
                    <div 
                      key={index} 
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`contact-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{contact.role}</p>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="w-4 h-4 mr-2" />
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Phone className="w-4 h-4 mr-2" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                            data-testid={`edit-contact-${index}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(contact)}
                            data-testid={`delete-contact-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                <span className="text-sm text-muted-foreground">Service Modules</span>
                <Badge variant="secondary" data-testid="modules-count">
                  {moduleData?.total || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contact Persons</span>
                <Badge variant="secondary">
                  {contactPersons.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Service Categories</span>
                <Badge variant="secondary">
                  {Array.isArray(supplier.categories) ? supplier.categories.length : 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={supplier.isActive ? "secondary" : "destructive"}>
                  {supplier.isActive ? "Active" : "Inactive"}
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
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact Person
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Supplier Info
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Building className="w-4 h-4 mr-2" />
                View Service Modules
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
