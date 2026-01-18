import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Building, MapPin, Calendar, User, Truck, Save } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { ServiceModule, Customer, Location, ServiceTemplate, Supplier, ServiceCategory, TemplateField } from "@shared/schema";

export default function ServiceModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [nextServiceDate, setNextServiceDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: module, isLoading } = useQuery<ServiceModule>({
    queryKey: ['/api/service-modules', id],
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ['/api/customers', module?.customerId],
    enabled: !!module?.customerId,
  });

  const { data: location } = useQuery<Location>({
    queryKey: ['/api/locations', module?.locationId],
    enabled: !!module?.locationId,
  });

  const { data: template } = useQuery<ServiceTemplate>({
    queryKey: ['/api/service-templates', module?.templateId],
    enabled: !!module?.templateId,
  });

  const { data: supplier } = useQuery<Supplier>({
    queryKey: ['/api/suppliers', module?.supplierId],
    enabled: !!module?.supplierId,
  });

  const { data: category } = useQuery<ServiceCategory>({
    queryKey: ['/api/service-categories', module?.categoryId],
    enabled: !!module?.categoryId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/service-modules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-modules', id] });
      setIsEditing(false);
      toast({ title: "Success", description: "Service module updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update service module",
        variant: "destructive" 
      });
    },
  });

  // Initialize form values when module loads
  useEffect(() => {
    if (module) {
      setFieldValues(module.fieldValues as Record<string, any> || {});
      setNextServiceDate(module.nextServiceDate ? format(new Date(module.nextServiceDate), 'yyyy-MM-dd') : '');
      setNotes(module.notes || '');
    }
  }, [module]);

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

  if (!module) {
    return (
      <Layout title="Service Module Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Service module not found</h3>
            <p className="text-muted-foreground mb-4">
              The service module you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/service-modules">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Service Modules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

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

  const handleSave = () => {
    const updateData = {
      fieldValues,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      notes: notes || undefined,
    };
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    // Reset to original values
    setFieldValues(module.fieldValues as Record<string, any> || {});
    setNextServiceDate(module.nextServiceDate ? format(new Date(module.nextServiceDate), 'yyyy-MM-dd') : '');
    setNotes(module.notes || '');
    setIsEditing(false);
  };

  const renderField = (field: TemplateField) => {
    const value = isEditing ? (fieldValues[field.id] ?? field.defaultValue ?? '') : ((module?.fieldValues as Record<string, any>)?.[field.id] ?? field.defaultValue ?? '');

    if (!isEditing) {
      return (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </Label>
          <p className="text-foreground" data-testid={`field-value-${field.id}`}>
            {field.type === 'checkbox' ? 
              (value === undefined ? 'Not specified' : (value ? 'Yes' : 'No')) : 
              (value !== undefined && value !== '' ? String(value) : 'Not specified')
            }
          </p>
        </div>
      );
    }

    const handleFieldChange = (newValue: any) => {
      let processedValue = newValue;
      
      // Convert number inputs to actual numbers
      if (field.type === 'number' && newValue !== '') {
        processedValue = parseFloat(newValue) || 0;
      } else if (field.type === 'number' && newValue === '') {
        processedValue = undefined;
      }
      
      setFieldValues(prev => ({ ...prev, [field.id]: processedValue }));
    };

    switch (field.type) {
      case 'text':
        return (
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              data-testid={`field-input-${field.id}`}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              rows={3}
              data-testid={`field-textarea-${field.id}`}
            />
          </div>
        );

      case 'number':
        return (
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              step="any"
              value={value ?? ''}
              onChange={(e) => handleFieldChange(e.target.value)}
              data-testid={`field-number-${field.id}`}
            />
          </div>
        );

      case 'date':
        return (
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              data-testid={`field-date-${field.id}`}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={field.id}
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(e.target.checked)}
              className="rounded border-input"
              data-testid={`field-checkbox-${field.id}`}
            />
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );

      case 'dropdown':
        return (
          <div>
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md"
              data-testid={`field-select-${field.id}`}
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      default:
        return (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">{field.label}</Label>
            <p className="text-muted-foreground">Field type not supported</p>
          </div>
        );
    }
  };

  const templateFields = (template?.fields as TemplateField[]) || [];
  const groupedFields = templateFields.reduce((acc, field) => {
    const section = field.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, TemplateField[]>);

  return (
    <Layout 
      title={module.moduleId}
      subtitle={`Service Module Details - ${customer?.name || 'Loading...'}`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/service-modules">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Service Modules
            </Button>
          </Link>
          {isEditing ? (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel} data-testid="cancel-edit-button">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                data-testid="save-changes-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)} data-testid="edit-module-button">
              Edit Module
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Module Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Module ID</Label>
                  <p className="text-foreground font-medium" data-testid="module-id">
                    {module.moduleId}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(module.status, module.nextServiceDate ? new Date(module.nextServiceDate).toISOString() : undefined)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
                  <p className="text-foreground" data-testid="customer-name">
                    {customer?.name || 'Loading...'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-foreground" data-testid="location-name">
                    {location?.name || 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Service Template</Label>
                  <p className="text-foreground" data-testid="template-name">
                    {template?.templateName || 'Loading...'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <div className="mt-1">
                    {category && (
                      <Badge 
                        style={{ 
                          backgroundColor: `${category.color || '#3B82F6'}20`, 
                          color: category.color || '#3B82F6' 
                        }}
                        className="border-0"
                      >
                        {category.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Next Service Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={nextServiceDate}
                      onChange={(e) => setNextServiceDate(e.target.value)}
                      data-testid="next-service-date-input"
                    />
                  ) : (
                    <p className="text-foreground" data-testid="next-service-date">
                      {module.nextServiceDate ? format(new Date(module.nextServiceDate), 'MMM d, yyyy') : 'Not scheduled'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assigned Supplier</Label>
                  <p className="text-foreground" data-testid="supplier-name">
                    {supplier?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              {(module.notes || isEditing) && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      data-testid="notes-textarea"
                    />
                  ) : (
                    <p className="text-foreground" data-testid="module-notes">
                      {module.notes || 'No notes'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Fields */}
          {templateFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedFields).map(([sectionName, sectionFields]) => (
                  <div key={sectionName}>
                    <h4 className="font-medium text-foreground mb-3 pb-2 border-b">
                      {sectionName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sectionFields.map((field) => (
                        <div key={field.id}>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Info & Actions */}
        <div className="space-y-6">
          
          {/* Service Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Service Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <Badge variant="secondary">
                  {format(new Date(module.createdAt), 'MMM d, yyyy')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <Badge variant="secondary">
                  {format(new Date(module.updatedAt), 'MMM d, yyyy')}
                </Badge>
              </div>
              {module.lastServiceDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Service</span>
                  <Badge variant="secondary">
                    {format(new Date(module.lastServiceDate), 'MMM d, yyyy')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/customers/${module.customerId}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Building className="w-4 h-4 mr-2" />
                  View Customer
                </Button>
              </Link>
              <Link href={`/locations/${module.locationId}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  View Location
                </Button>
              </Link>
              {module.supplierId && (
                <Link href={`/suppliers/${module.supplierId}`}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Truck className="w-4 h-4 mr-2" />
                    View Supplier
                  </Button>
                </Link>
              )}
              <Link href={`/service-templates/${module.templateId}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Template
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
