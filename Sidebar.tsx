import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  FileText, 
  Package, 
  Truck, 
  Settings,
  Building,
  TrendingUp,
  ClipboardList,
  Map,
  FileSignature,
  FileCheck,
  ArrowRightLeft,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Globe,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const salesNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Sales Pipeline", href: "/sales", icon: TrendingUp },
  { name: "Proposals", href: "/proposals", icon: FileSignature },
  { name: "Contracts", href: "/contracts", icon: FileCheck },
  { name: "Procurement", href: "/procurement", icon: ClipboardList },
];

const masterDataNavigation = [
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Service Templates", href: "/service-templates", icon: FileText },
  { name: "Service Modules", href: "/service-modules", icon: Package },
  { name: "Service Map", href: "/service-map", icon: Map },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
];

const operationsNavigation = [
  { name: "Transitions", href: "/transitions", icon: ArrowRightLeft },
  { name: "Work Orders", href: "/work-orders", icon: Wrench },
  { name: "Service Logs", href: "/service-logs", icon: ClipboardCheck },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
];

const insightsNavigation = [
  { name: "Customer Portal", href: "/customer-portal", icon: Globe },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

function NavSection({ title, items, location }: { title: string; items: typeof salesNavigation; location: string }) {
  return (
    <div className="mb-4">
      <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-60 bg-card border-r border-border flex-shrink-0 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Building className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">MatriXx360</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <NavSection title="Sales & Pipeline" items={salesNavigation} location={location} />
        <NavSection title="Master Data" items={masterDataNavigation} location={location} />
        <NavSection title="Operations" items={operationsNavigation} location={location} />
        <NavSection title="Insights" items={insightsNavigation} location={location} />
        
        <div className="pt-4 border-t border-border mt-4">
          <Link 
            href="/settings"
            data-testid="nav-settings"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              location === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">FM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Facility Manager</p>
            <p className="text-xs text-muted-foreground truncate">CBRE Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
