import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Settings, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { ServiceTemplate, ServiceCategory, TemplateField } from "@shared/schema";
import { randomUUID } from "crypto";

const fieldFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.enum(['text', 'number', 'dropdown', 'date', 'checkbox', 'file', 'textarea']),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  options: z.string().optional(), // For dropdown fields, comma-separated
  section: z.string().optional(),
});

type FieldFormData = z.infer<typeof fieldFormSchema>;

export default function ServiceTemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const { toast } = useToast();

  const { data: template, isLoading } = useQuery<ServiceTemplate>({
    queryKey: ['/api/service-templates', id],
  });

  const { data: category } = useQuery<ServiceCategory>({
    queryKey: ['/api/service-categories', template?.categoryId],
    enabled: !!template?.categoryId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { fields: TemplateField[] }) => {
      const response = await apiRequest('PUT', `/api/service-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-templates', id] });
      setIsFieldDialogOpen(false);
      setEditingField(null);
      form.reset();
      toast({ title: "Success", description: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update template",
        variant: "destructive" 
      });
    },
  });

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      label: "",
      type: "text",
      required: false,
      defaultValue: "",
      options: "",
      section: "",
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

  if (!template) {
    return (
      <Layout title="Template Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Service template not found</h3>
            <p className="text-muted-foreground mb-4">
              The service template you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/service-templates">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Service Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const fields = (template.fields as TemplateField[]) || [];

  const onSubmit = (data: FieldFormData) => {
    const newField: TemplateField = {
      id: editingField?.id || Date.now().toString(),
      label: data.label,
      type: data.type,
      required: data.required,
      defaultValue: data.defaultValue,
      options: data.type === 'dropdown' ? data.options?.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      section: data.section || undefined,
    };

    let updatedFields: TemplateField[];
    if (editingField) {
      updatedFields = fields.map(field => field.id === editingField.id ? newField : field);
    } else {
      updatedFields = [...fields, newField];
    }

    updateMutation.mutate({ fields: updatedFields });
  };

  const handleEditField = (field: TemplateField) => {
    setEditingField(field);
    form.reset({
      label: field.label,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue || "",
      options: field.options?.join(', ') || "",
      section: field.section || "",
    });
    setIsFieldDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      const updatedFields = fields.filter(field => field.id !== fieldId);
      updateMutation.mutate({ fields: updatedFields });
    }
  };

  const resetForm = () => {
    setEditingField(null);
    form.reset({
      label: "",
      type: "text",
      required: false,
      defaultValue: "",
      options: "",
      section: "",
    });
  };

  const groupedFields = fields.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, TemplateField[]>);

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'dropdown': return '📋';
      case 'date': return '📅';
      case 'checkbox': return '☑️';
      case 'file': return '📎';
      case 'textarea': return '📄';
      default: return '📝';
    }
  };

  return (
    <Layout 
      title={template.templateName}
      subtitle={`Service Template Configuration - ${fields.length} fields`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/service-templates">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </Link>
          <Dialog 
            open={isFieldDialogOpen} 
            onOpenChange={(open) => {
              setIsFieldDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" data-testid="add-field-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? 'Edit Field' : 'Add New Field'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Label</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Serial Number" data-testid="field-label-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="field-type-select">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="text">Text Input</SelectItem>
                            <SelectItem value="textarea">Text Area</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="file">File Upload</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('type') === 'dropdown' && (
                    <FormField
                      control={form.control}
                      name="options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dropdown Options</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Option 1, Option 2, Option 3" data-testid="field-options-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Technical Specs" data-testid="field-section-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Value (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="field-default-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="field-required-checkbox"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Required Field</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setIsFieldDialogOpen(false);
                        resetForm();
                      }}
                      data-testid="cancel-field-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateMutation.isPending}
                      data-testid="save-field-button"
                    >
                      {editingField ? 'Update' : 'Add'} Field
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Template Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Template Name</Label>
                  <p className="text-foreground font-medium" data-testid="template-name">
                    {template.templateName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <div className="mt-1">
                    <Badge 
                      style={{ 
                        backgroundColor: `${category?.color || '#3B82F6'}20`, 
                        color: category?.color || '#3B82F6' 
                      }}
                      className="border-0"
                    >
                      {category?.name || 'Unknown Category'}
                    </Badge>
                  </div>
                </div>
              </div>

              {template.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-foreground" data-testid="template-description">
                    {template.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Form Fields ({fields.length})</CardTitle>
                <Button size="sm" onClick={() => setIsFieldDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No fields configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Add form fields to collect information when creating service modules.
                  </p>
                  <Button onClick={() => setIsFieldDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedFields).map(([sectionName, sectionFields]) => (
                    <div key={sectionName}>
                      <h4 className="font-medium text-foreground mb-3 pb-2 border-b">
                        {sectionName}
                      </h4>
                      <div className="space-y-2">
                        {sectionFields.map((field) => (
                          <div 
                            key={field.id} 
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                            data-testid={`field-${field.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-foreground">{field.label}</span>
                                  {field.required && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground capitalize">
                                  {field.type} field
                                  {field.defaultValue && ` • Default: ${field.defaultValue}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField(field)}
                                data-testid={`edit-field-${field.id}`}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteField(field.id)}
                                data-testid={`delete-field-${field.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Preview & Actions */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Template Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Fields</span>
                <Badge variant="secondary" data-testid="fields-count">
                  {fields.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Required Fields</span>
                <Badge variant="secondary">
                  {fields.filter(f => f.required).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sections</span>
                <Badge variant="secondary">
                  {Object.keys(groupedFields).length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Service Module
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Preview Form
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
