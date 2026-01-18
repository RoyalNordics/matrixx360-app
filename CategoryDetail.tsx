import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Plus, Edit, Trash2, Settings } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Location, ServiceModule, ServiceCategory } from "@shared/schema";

export default function CategoryDetail() {
  const { locationId, categoryId } = useParams<{ locationId: string; categoryId: string }>();
  const { toast } = useToast();

  const { data: location } = useQuery<Location>({
    queryKey: ['/api/locations', locationId],
    enabled: !!locationId,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/service-categories'],
  });

  const category = Array.isArray(categories) ? categories.find((c: ServiceCategory) => c.id === categoryId) : null;

  const { data: moduleData, isLoading } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules', 'byLocationAndCategory', locationId, categoryId],
    queryFn: () => fetch(`/api/service-modules?locationId=${locationId}&categoryId=${categoryId}`).then(res => res.json()),
    enabled: !!locationId && !!categoryId,
  });

  if (categoriesLoading || isLoading) {
    return (
      <Layout title="Loading...">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!location || !category) {
    return (
      <Layout title="Not Found">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Location or category not found</h3>
            <p className="text-muted-foreground mb-4">
              The location or category you're looking for doesn't exist or has been deleted.
            </p>
            <Link href={locationId ? `/locations/${locationId}` : "/customers"}>
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {locationId ? 'Location' : 'Customers'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const getCategoryBadge = () => {
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
      title={`${category.name} Modules`}
      subtitle={`${location.name} - ${moduleData?.total || 0} service modules in this category`}
      actions={
        <div className="flex items-center space-x-3">
          <Link href={`/locations/${locationId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Location
            </Button>
          </Link>
          <Button size="sm" data-testid="add-service-module-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Modules List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Category Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Category Information
                {getCategoryBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category Name</label>
                <p className="text-foreground font-medium" data-testid="category-name">
                  {category.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-foreground font-medium" data-testid="location-name">
                  {location.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Modules</label>
                <p className="text-foreground font-medium" data-testid="modules-total">
                  {moduleData?.total || 0} modules
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Modules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Service Modules ({moduleData?.total || 0})
                </CardTitle>
                <Button 
                  size="sm" 
                  data-testid="add-module-in-category-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!moduleData?.modules || moduleData.modules.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No modules in this category yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add service modules to track maintenance and compliance for {category.name}.
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {moduleData.modules.map((module) => (
                    <Link 
                      key={module.id} 
                      href={`/service-modules/${module.id}`}
                    >
                      <div 
                        className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        data-testid={`service-module-${module.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-foreground">{module.moduleId}</h4>
                              <Badge 
                                variant={module.status === 'active' ? 'default' : 
                                         module.status === 'overdue' ? 'destructive' : 'secondary'}
                                className="capitalize"
                              >
                                {module.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Status: <span className="capitalize">{module.status}</span>
                            </div>
                            {module.nextServiceDate && (
                              <div className="text-sm text-muted-foreground">
                                Next Service: {new Date(module.nextServiceDate).toLocaleDateString()}
                              </div>
                            )}
                            {module.lastServiceDate && (
                              <div className="text-sm text-muted-foreground">
                                Last Service: {new Date(module.lastServiceDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <span className="text-sm mr-2">View details</span>
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Category Stats */}
        <div className="space-y-6">
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Category Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Modules</span>
                <Badge variant="secondary" data-testid="total-modules-count">
                  {moduleData?.total || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Services</span>
                <Badge variant="secondary">
                  {moduleData?.modules?.filter((m: ServiceModule) => m.status === 'active').length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue Services</span>
                <Badge variant="destructive">
                  {moduleData?.modules?.filter((m: ServiceModule) => {
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Service Module
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Link href={`/locations/${locationId}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Location
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}