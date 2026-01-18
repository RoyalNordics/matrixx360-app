import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Plus, Edit, Trash2, Palette, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceCategory, InsertServiceCategory, ContractType, InsertContractType } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const contractTypeFormSchema = z.object({
  name: z.string().min(1, "Contract type name is required"),
  templateType: z.enum(["managed", "cost-plus"], {
    required_error: "Template type is required",
  }),
  // Managed Contract fields
  serviceScope: z.string().optional(),
  performanceKpis: z.string().optional(), // Comma-separated, will convert to array
  paymentModel: z.enum(['fixed-monthly', 'per-unit', 'hybrid', 'other', '']).optional(),
  feeAmount: z.string().optional(), // Number as string
  bonusPenaltyRules: z.string().optional(),
  reportingFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'other', '']).optional(),
  governanceFrequency: z.string().optional(),
  changeManagementProcess: z.string().optional(),
  subcontractors: z.string().optional(), // Comma-separated, will convert to array
  // Cost-Plus Contract fields
  costBaseDefinition: z.string().optional(),
  markupType: z.enum(['percent', 'fixed', '']).optional(),
  markupValue: z.string().optional(), // Number as string
  costCap: z.string().optional(), // Number as string
  documentationRequirements: z.string().optional(),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'on-completion', 'other', '']).optional(),
  auditRights: z.boolean().optional(),
  bonusCriteria: z.string().optional(),
  riskSharingAgreement: z.string().optional(),
});

type ContractTypeFormData = z.infer<typeof contractTypeFormSchema>;

const predefinedColors = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#10B981", // Green
  "#EF4444", // Red
  "#F59E0B", // Yellow
  "#6B7280", // Gray
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
];

export default function Settings() {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractType | null>(null);
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
  });

  const { data: contractTypes = [], isLoading: isLoadingContracts } = useQuery<ContractType[]>({
    queryKey: ['/api/contract-types'],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertServiceCategory) => {
      const response = await apiRequest('POST', '/api/service-categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      setIsCategoryDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Service category created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create service category",
        variant: "destructive" 
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertServiceCategory> }) => {
      const response = await apiRequest('PUT', `/api/service-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      setEditingCategory(null);
      resetForm();
      toast({ title: "Success", description: "Service category updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update service category",
        variant: "destructive" 
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/service-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      toast({ title: "Success", description: "Service category deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete service category",
        variant: "destructive" 
      });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: ContractTypeFormData) => {
      // Convert comma-separated strings to arrays
      const performanceKpisArray = data.performanceKpis 
        ? data.performanceKpis.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const subcontractorsArray = data.subcontractors
        ? data.subcontractors.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      
      // Parse numeric values (decimals are stored as strings but validated as numbers)
      const feeAmountParsed = data.feeAmount && data.feeAmount.trim() !== '' ? data.feeAmount : null;
      const markupValueParsed = data.markupValue && data.markupValue.trim() !== '' ? data.markupValue : null;
      const costCapParsed = data.costCap && data.costCap.trim() !== '' ? data.costCap : null;
      
      const payload = {
        ...data,
        performanceKpis: performanceKpisArray,
        subcontractors: subcontractorsArray,
        paymentModel: data.paymentModel || null,
        reportingFrequency: data.reportingFrequency || null,
        markupType: data.markupType || null,
        paymentFrequency: data.paymentFrequency || null,
        feeAmount: feeAmountParsed,
        markupValue: markupValueParsed,
        costCap: costCapParsed,
      };
      const response = await apiRequest('POST', '/api/contract-types', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-types'] });
      setIsContractDialogOpen(false);
      resetContractForm();
      toast({ title: "Success", description: "Contract type created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create contract type",
        variant: "destructive" 
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<ContractTypeFormData> }) => {
      // Convert comma-separated strings to arrays
      const performanceKpisArray = data.performanceKpis 
        ? data.performanceKpis.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const subcontractorsArray = data.subcontractors
        ? data.subcontractors.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      
      // Parse numeric values (decimals are stored as strings but validated as numbers)
      const feeAmountParsed = data.feeAmount && data.feeAmount.trim() !== '' ? data.feeAmount : null;
      const markupValueParsed = data.markupValue && data.markupValue.trim() !== '' ? data.markupValue : null;
      const costCapParsed = data.costCap && data.costCap.trim() !== '' ? data.costCap : null;
      
      const payload = {
        ...data,
        performanceKpis: performanceKpisArray,
        subcontractors: subcontractorsArray,
        paymentModel: data.paymentModel || null,
        reportingFrequency: data.reportingFrequency || null,
        markupType: data.markupType || null,
        paymentFrequency: data.paymentFrequency || null,
        feeAmount: feeAmountParsed,
        markupValue: markupValueParsed,
        costCap: costCapParsed,
      };
      const response = await apiRequest('PUT', `/api/contract-types/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-types'] });
      setEditingContract(null);
      resetContractForm();
      toast({ title: "Success", description: "Contract type updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update contract type",
        variant: "destructive" 
      });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/contract-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-types'] });
      toast({ title: "Success", description: "Contract type deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete contract type",
        variant: "destructive" 
      });
    },
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6",
    },
  });

  const contractForm = useForm<ContractTypeFormData>({
    resolver: zodResolver(contractTypeFormSchema),
    defaultValues: {
      name: "",
      templateType: "managed",
      serviceScope: "",
      performanceKpis: "",
      paymentModel: "",
      feeAmount: "",
      bonusPenaltyRules: "",
      reportingFrequency: "",
      governanceFrequency: "",
      changeManagementProcess: "",
      subcontractors: "",
      costBaseDefinition: "",
      markupType: "",
      markupValue: "",
      costCap: "",
      documentationRequirements: "",
      paymentFrequency: "",
      auditRights: false,
      bonusCriteria: "",
      riskSharingAgreement: "",
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6",
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDelete = (category: ServiceCategory) => {
    if (confirm(`Are you sure you want to delete ${category.name}? This cannot be undone.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    form.reset({
      name: "",
      description: "",
      color: "#3B82F6",
    });
  };

  const onContractSubmit = (data: ContractTypeFormData) => {
    if (editingContract) {
      updateContractMutation.mutate({ id: editingContract.id, data });
    } else {
      createContractMutation.mutate(data);
    }
  };

  const handleEditContract = (contract: ContractType) => {
    setEditingContract(contract);
    // Convert arrays back to comma-separated strings
    const performanceKpisStr = Array.isArray(contract.performanceKpis) 
      ? contract.performanceKpis.join(', ') 
      : '';
    const subcontractorsStr = Array.isArray(contract.subcontractors)
      ? contract.subcontractors.join(', ')
      : '';
    
    contractForm.reset({
      name: contract.name,
      templateType: contract.templateType as "managed" | "cost-plus",
      serviceScope: contract.serviceScope || "",
      performanceKpis: performanceKpisStr,
      paymentModel: (contract.paymentModel as any) || "",
      feeAmount: contract.feeAmount || "",
      bonusPenaltyRules: contract.bonusPenaltyRules || "",
      reportingFrequency: (contract.reportingFrequency as any) || "",
      governanceFrequency: contract.governanceFrequency || "",
      changeManagementProcess: contract.changeManagementProcess || "",
      subcontractors: subcontractorsStr,
      costBaseDefinition: contract.costBaseDefinition || "",
      markupType: (contract.markupType as any) || "",
      markupValue: contract.markupValue || "",
      costCap: contract.costCap || "",
      documentationRequirements: contract.documentationRequirements || "",
      paymentFrequency: (contract.paymentFrequency as any) || "",
      auditRights: contract.auditRights || false,
      bonusCriteria: contract.bonusCriteria || "",
      riskSharingAgreement: contract.riskSharingAgreement || "",
    });
    setIsContractDialogOpen(true);
  };

  const handleDeleteContract = (contract: ContractType) => {
    if (confirm(`Are you sure you want to delete ${contract.name}? This cannot be undone.`)) {
      deleteContractMutation.mutate(contract.id);
    }
  };

  const resetContractForm = () => {
    setEditingContract(null);
    contractForm.reset({
      name: "",
      templateType: "managed",
      serviceScope: "",
      performanceKpis: "",
      paymentModel: "",
      feeAmount: "",
      bonusPenaltyRules: "",
      reportingFrequency: "",
      governanceFrequency: "",
      changeManagementProcess: "",
      subcontractors: "",
      costBaseDefinition: "",
      markupType: "",
      markupValue: "",
      costCap: "",
      documentationRequirements: "",
      paymentFrequency: "",
      auditRights: false,
      bonusCriteria: "",
      riskSharingAgreement: "",
    });
  };

  const selectedColor = form.watch('color');
  const selectedTemplateType = contractForm.watch('templateType');

  return (
    <Layout 
      title="Settings" 
      subtitle="Manage system configuration and service categories"
    >
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Service Categories</TabsTrigger>
          <TabsTrigger value="contracts">Contract Types</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Service Categories ({categories.length})
                </CardTitle>
                <Dialog 
                  open={isCategoryDialogOpen} 
                  onOpenChange={(open) => {
                    setIsCategoryDialogOpen(open);
                    if (!open) resetForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button data-testid="add-category-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Edit Service Category' : 'Add New Service Category'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. HVAC Systems" data-testid="category-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} data-testid="category-description-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <FormControl>
                                    <Input {...field} type="color" className="w-20 h-10 rounded-md" data-testid="color-picker" />
                                  </FormControl>
                                  <div 
                                    className="flex-1 px-3 py-2 rounded-md border"
                                    style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
                                  >
                                    Preview: {form.watch('name') || 'Sample Category'}
                                  </div>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {predefinedColors.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className={`w-8 h-8 rounded-md border-2 ${
                                        selectedColor === color ? 'border-foreground' : 'border-transparent'
                                      }`}
                                      style={{ backgroundColor: color }}
                                      onClick={() => field.onChange(color)}
                                      data-testid={`color-${color}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-3">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setIsCategoryDialogOpen(false);
                              resetForm();
                            }}
                            data-testid="cancel-category-button"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                            data-testid="save-category-button"
                          >
                            {editingCategory ? 'Update' : 'Create'} Category
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No service categories</h3>
                  <p className="text-muted-foreground mb-4">
                    Create service categories to organize your service templates and modules.
                  </p>
                  <Button onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div 
                      key={category.id} 
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`category-${category.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          />
                          <div>
                            <h4 className="font-medium text-foreground">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                          <Badge 
                            style={{ backgroundColor: `${category.color || '#3B82F6'}20`, color: category.color || '#3B82F6' }}
                            className="border-0"
                          >
                            {category.name}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            data-testid={`edit-category-${category.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            data-testid={`delete-category-${category.id}`}
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
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Contract Types ({contractTypes.length})
                </CardTitle>
                <Dialog 
                  open={isContractDialogOpen} 
                  onOpenChange={(open) => {
                    setIsContractDialogOpen(open);
                    if (!open) resetContractForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button data-testid="add-contract-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contract Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingContract ? 'Edit Contract Type' : 'Add New Contract Type'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...contractForm}>
                      <form onSubmit={contractForm.handleSubmit(onContractSubmit)} className="space-y-4">
                        <FormField
                          control={contractForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contract Type Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. Standard Managed Contract" data-testid="contract-name-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={contractForm.control}
                          name="templateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="template-type-select">
                                    <SelectValue placeholder="Select template type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="managed">Managed</SelectItem>
                                  <SelectItem value="cost-plus">Cost-Plus</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {selectedTemplateType === "managed" && (
                          <>
                            <div className="pt-4 border-t">
                              <h4 className="text-sm font-medium mb-4">Managed Contract Fields</h4>
                              
                              <div className="space-y-4">
                                <FormField
                                  control={contractForm.control}
                                  name="serviceScope"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Service Scope</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="service-scope-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="performanceKpis"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Performance KPIs</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="performance-kpis-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="paymentModel"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Payment Model</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="payment-model-select">
                                            <SelectValue placeholder="Select payment model" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="fixed-monthly">Fast månedlig fee</SelectItem>
                                          <SelectItem value="per-unit">Per unit</SelectItem>
                                          <SelectItem value="hybrid">Hybrid</SelectItem>
                                          <SelectItem value="other">Andet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="feeAmount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Fee Amount</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" data-testid="fee-amount-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="bonusPenaltyRules"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Bonus/Penalty Rules</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="bonus-penalty-rules-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="reportingFrequency"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Reporting Frequency</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="reporting-frequency-select">
                                            <SelectValue placeholder="Select reporting frequency" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="weekly">Ugentligt</SelectItem>
                                          <SelectItem value="monthly">Månedligt</SelectItem>
                                          <SelectItem value="quarterly">Kvartalsvist</SelectItem>
                                          <SelectItem value="yearly">Årligt</SelectItem>
                                          <SelectItem value="other">Andet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="governanceFrequency"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Governance Frequency</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="governance-frequency-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="changeManagementProcess"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Change Management Process</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="change-management-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="subcontractors"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Subcontractors Included</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="subcontractors-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {selectedTemplateType === "cost-plus" && (
                          <>
                            <div className="pt-4 border-t">
                              <h4 className="text-sm font-medium mb-4">Cost-Plus Contract Fields</h4>
                              
                              <div className="space-y-4">
                                <FormField
                                  control={contractForm.control}
                                  name="costBaseDefinition"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cost Base Definition</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="cost-base-definition-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="markupType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Markup Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="markup-type-select">
                                            <SelectValue placeholder="Select markup type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="fixed">Fast fee</SelectItem>
                                          <SelectItem value="percent">Procent</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="markupValue"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Markup Value</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" data-testid="markup-value-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="costCap"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cost Cap</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" data-testid="cost-cap-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="documentationRequirements"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Documentation Requirements</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="documentation-requirements-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="paymentFrequency"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Payment Frequency</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="payment-frequency-select">
                                            <SelectValue placeholder="Select payment frequency" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="monthly">Månedligt</SelectItem>
                                          <SelectItem value="quarterly">Kvartalsvist</SelectItem>
                                          <SelectItem value="on-completion">Ved færdiggørelse</SelectItem>
                                          <SelectItem value="other">Andet</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="auditRights"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          data-testid="audit-rights-checkbox"
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Audit Rights</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="bonusCriteria"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Bonus Criteria</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="bonus-criteria-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={contractForm.control}
                                  name="riskSharingAgreement"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Risk Sharing Agreement</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} rows={3} data-testid="risk-sharing-input" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setIsContractDialogOpen(false);
                              resetContractForm();
                            }}
                            data-testid="cancel-contract-button"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createContractMutation.isPending || updateContractMutation.isPending}
                            data-testid="save-contract-button"
                          >
                            {editingContract ? 'Update' : 'Create'} Contract Type
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingContracts ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : contractTypes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No contract types</h3>
                  <p className="text-muted-foreground mb-4">
                    Create contract types to define templates for managed and cost-plus contracts.
                  </p>
                  <Button onClick={() => setIsContractDialogOpen(true)} data-testid="add-first-contract-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Contract Type
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractTypes.map((contract) => (
                    <div 
                      key={contract.id} 
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      data-testid={`contract-${contract.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground">{contract.name}</h4>
                            <Badge variant="outline">
                              {contract.templateType === "managed" ? "Managed" : "Cost-Plus"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {contract.templateType === "managed" && (
                              <>
                                {contract.paymentModel && (
                                  <p data-testid={`contract-payment-model-${contract.id}`}>
                                    Payment Model: {contract.paymentModel}
                                  </p>
                                )}
                                {contract.reportingFrequency && (
                                  <p data-testid={`contract-reporting-frequency-${contract.id}`}>
                                    Reporting: {contract.reportingFrequency}
                                  </p>
                                )}
                              </>
                            )}
                            {contract.templateType === "cost-plus" && (
                              <>
                                {contract.markupType && (
                                  <p data-testid={`contract-markup-type-${contract.id}`}>
                                    Markup Type: {contract.markupType}
                                  </p>
                                )}
                                {contract.paymentFrequency && (
                                  <p data-testid={`contract-payment-frequency-${contract.id}`}>
                                    Payment: {contract.paymentFrequency}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContract(contract)}
                            data-testid={`edit-contract-${contract.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContract(contract)}
                            data-testid={`delete-contract-${contract.id}`}
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
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Application Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-assign Module IDs</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Service Interval</span>
                      <Badge variant="secondary">30 days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications</span>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      Export All Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      Import Templates
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm" disabled>
                      Backup Database
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <SettingsIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">User Management</h3>
                <p className="text-muted-foreground mb-4">
                  User management features will be available in a future release.
                </p>
                <Button variant="outline" disabled>
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
