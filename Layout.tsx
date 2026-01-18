import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Search, Bell } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, subtitle, actions }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
            {subtitle && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{subtitle}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {actions}
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search modules, customers..." 
                className="w-64 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                data-testid="header-search"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            
            <button 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
              data-testid="notifications-button"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
