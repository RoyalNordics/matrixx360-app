import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import SalesPipeline from "@/pages/SalesPipeline";
import SalesCaseDetail from "@/pages/SalesCaseDetail";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Locations from "@/pages/Locations";
import LocationDetail from "@/pages/LocationDetail";
import ServiceTemplates from "@/pages/ServiceTemplates";
import ServiceTemplateDetail from "@/pages/ServiceTemplateDetail";
import ServiceModules from "@/pages/ServiceModules";
import ServiceModuleDetail from "@/pages/ServiceModuleDetail";
import CategoryDetail from "@/pages/CategoryDetail";
import Suppliers from "@/pages/Suppliers";
import SupplierDetail from "@/pages/SupplierDetail";
import Procurement from "@/pages/Procurement";
import ProcurementDetail from "@/pages/ProcurementDetail";
import ServiceMap from "@/pages/ServiceMap";
import Proposals from "@/pages/Proposals";
import Contracts from "@/pages/Contracts";
import WorkOrders from "@/pages/WorkOrders";
import Transitions from "@/pages/Transitions";
import Incidents from "@/pages/Incidents";
import ServiceLogs from "@/pages/ServiceLogs";
import CustomerPortal from "@/pages/CustomerPortal";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      {/* Dashboard */}
      <Route path="/" component={Dashboard} />
      
      {/* Sales Pipeline */}
      <Route path="/sales" component={SalesPipeline} />
      <Route path="/sales/:id" component={SalesCaseDetail} />
      
      {/* Customers */}
      <Route path="/customers" component={Customers} />
      <Route path="/customers/:id" component={CustomerDetail} />
      
      {/* Locations */}
      <Route path="/locations" component={Locations} />
      <Route path="/locations/:id" component={LocationDetail} />
      <Route path="/locations/:locationId/categories/:categoryId" component={CategoryDetail} />
      
      {/* Service Templates */}
      <Route path="/service-templates" component={ServiceTemplates} />
      <Route path="/service-templates/:id" component={ServiceTemplateDetail} />
      
      {/* Service Modules */}
      <Route path="/service-modules" component={ServiceModules} />
      <Route path="/service-modules/:id" component={ServiceModuleDetail} />
      
      {/* Service Map */}
      <Route path="/service-map" component={ServiceMap} />
      
      {/* Suppliers */}
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/suppliers/:id" component={SupplierDetail} />
      
      {/* Procurement (RFQ/Tender) */}
      <Route path="/procurement" component={Procurement} />
      <Route path="/procurement/:id" component={ProcurementDetail} />
      
      {/* Proposals & Contracts */}
      <Route path="/proposals" component={Proposals} />
      <Route path="/contracts" component={Contracts} />
      
      {/* Transitions */}
      <Route path="/transitions" component={Transitions} />
      
      {/* Work Orders */}
      <Route path="/work-orders" component={WorkOrders} />
      
      {/* Service Logs */}
      <Route path="/service-logs" component={ServiceLogs} />
      
      {/* Incidents */}
      <Route path="/incidents" component={Incidents} />
      
      {/* Customer Portal */}
      <Route path="/customer-portal" component={CustomerPortal} />
      
      {/* Analytics */}
      <Route path="/analytics" component={Analytics} />
      
      {/* Settings */}
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
