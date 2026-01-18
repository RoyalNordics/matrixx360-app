import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Building2, CheckCircle, Download, Plus, Users, Package, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardStats {
  overdueCount: number;
  dueSoonCount: number;
  missingSuppliersCount: number;
  activeModulesCount: number;
}

interface ServiceModule {
  id: string;
  moduleId: string;
  customerId: string;
  locationId: string;
  categoryId: string;
  supplierId?: string;
  responsibleUserId?: string;
  nextServiceDate?: string;
  status: string;
  createdAt: string;
}

interface ActivityLogEntry {
  id: string;
  userId?: string;
  entityType: string;
  action: string;
  details: any;
  createdAt: string;
}

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: moduleData } = useQuery<{ modules: ServiceModule[], total: number }>({
    queryKey: ['/api/service-modules'],
  });

  const { data: activities } = useQuery<ActivityLogEntry[]>({
    queryKey: ['/api/activity-log'],
  });

  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/service-categories'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (categoryId: string) => {
    const category = Array.isArray(categories) ? categories.find((c: any) => c.id === categoryId) : null;
    if (!category) return null;
    
    return (
      <Badge 
        style={{ backgroundColor: `${category.color}20`, color: category.color }}
        className="border-0"
      >
        {category.name}
      </Badge>
    );
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Layout 
      title="Dashboard" 
      subtitle="Last updated: 2 minutes ago"
      actions={
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" data-testid="export-button">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" data-testid="new-service-module-button">
            <Plus className="w-4 h-4 mr-2" />
            New Service Module
          </Button>
        </div>
      }
    >
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Services</p>
                <p className="text-2xl font-bold text-destructive" data-testid="overdue-count">
                  {stats?.overdueCount || 0}
                </p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="link" 
                className="text-sm text-destructive hover:underline font-medium p-0"
                data-testid="view-overdue-details"
              >
                View Details →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Within 10 Days</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="due-soon-count">
                  {stats?.dueSoonCount || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="link" 
                className="text-sm text-yellow-600 hover:underline font-medium p-0"
                data-testid="view-due-soon-details"
              >
                View Details →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missing Suppliers</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="missing-suppliers-count">
                  {stats?.missingSuppliersCount || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="link" 
                className="text-sm text-orange-600 hover:underline font-medium p-0"
                data-testid="view-missing-suppliers-details"
              >
                View Details →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Modules</p>
                <p className="text-2xl font-bold text-green-600" data-testid="active-modules-count">
                  {stats?.activeModulesCount || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="link" 
                className="text-sm text-green-600 hover:underline font-medium p-0"
                data-testid="view-all-modules"
              >
                View All →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Service Modules Table */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Recent Service Modules</h3>
        </div>
        
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
                  Responsible
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {moduleData?.modules?.slice(0, 5).map((module) => (
                <tr key={module.id} className="hover:bg-muted/25" data-testid={`module-row-${module.moduleId}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-foreground">{module.moduleId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {Array.isArray(customers) ? customers.find((c: any) => c.id === module.customerId)?.name || 'Unknown Customer' : 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-muted-foreground">Location details</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(module.categoryId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(module.status, module.nextServiceDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {module.nextServiceDate ? format(new Date(module.nextServiceDate), 'MMM d, yyyy') : 'Not scheduled'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {module.responsibleUserId ? 'Assigned User' : 'Unassigned'}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No service modules found. Create your first service module to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Row - Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity */}
        <Card>
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {activities?.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.action}</span> {activity.entityType}
                      {activity.details?.name && ` - ${activity.details.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Quick Actions</h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col items-start space-y-2 hover:bg-accent"
                data-testid="quick-add-customer"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Add Customer</p>
                    <p className="text-xs text-muted-foreground">Create new customer</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col items-start space-y-2 hover:bg-accent"
                data-testid="quick-new-module"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">New Module</p>
                    <p className="text-xs text-muted-foreground">Create service module</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col items-start space-y-2 hover:bg-accent"
                data-testid="quick-new-template"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">New Template</p>
                    <p className="text-xs text-muted-foreground">Build service template</p>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex-col items-start space-y-2 hover:bg-accent"
                data-testid="quick-add-supplier"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Add Supplier</p>
                    <p className="text-xs text-muted-foreground">Register new supplier</p>
                  </div>
                </div>
              </Button>
              
            </div>
          </CardContent>
        </Card>
        
      </div>
    </Layout>
  );
}
