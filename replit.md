# MatriXx360 - Professional Service Management Platform

## Overview

MatriXx360 is a comprehensive web application designed for facility management organizations like CBRE. The system provides complete control and oversight of customers, locations, service categories, individual service modules, suppliers, and maintenance workflows. Built as a full-stack TypeScript application, it features a React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

The platform enables dynamic service template creation, allowing users to define custom field structures for different types of equipment and services. These templates are then used to generate service modules that can be assigned to specific locations and managed throughout their lifecycle.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Framework**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod schema validation
- **File Uploads**: Uppy integration for file management with dashboard interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between client and server
- **File Storage**: Google Cloud Storage integration with ACL policies
- **Build System**: esbuild for server bundling, Vite for client bundling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Object Storage**: Google Cloud Storage for file uploads and attachments
- **Database Design**: 
  - Hierarchical structure: Customers → Locations → Service Modules
  - Dynamic templating system for customizable service fields
  - Activity logging for audit trails
  - Supplier management with contact persons and ratings

### Authentication and Authorization
- **File Access Control**: Custom ACL policy system for object storage
- **User Management**: Role-based access (admin, manager, technician)
- **Session Management**: Cookie-based authentication with credential handling

### Core Domain Models
- **Customers**: Company information with CVR numbers, contacts, and optional contract type assignment
- **Locations**: Physical sites linked to customers with comprehensive address details (street, street number, zip code, city), main phone, category classification, GPS coordinates, and local contact information including name, email, phone, and role
- **Service Templates**: Dynamic field definitions for different equipment types
- **Service Modules**: Instances of templates assigned to specific locations
- **Suppliers**: Vendor management with ratings and category assignments
- **Contract Types**: Template-based contract definitions for Managed and Cost-Plus contracts with full JSON schema compliance (arrays for KPIs/subcontractors, enums for frequencies/models)
- **Sales Cases**: Lead-to-close opportunity tracking with Kanban-style pipeline management
- **Sales Activities**: Meeting, call, email, and other activity tracking with outcome status
- **Sales Notes**: Internal and shared notes on sales cases for team collaboration
- **Activity Logging**: Comprehensive audit trail for all system changes

### Sales Pipeline Module (MODULE A)
- **Pipeline Stages**: Lead → Discovery → Proposal → Negotiation → Won/Lost workflow
- **Probability Tracking**: Automatic probability assignment based on stage (10% → 30% → 50% → 70% → 100%)
- **Case Numbers**: Auto-generated sequential case numbers (SC-0001, SC-0002, etc.)
- **Customer Linking**: Optional association of sales cases with existing customers
- **Value Management**: Estimated value and weighted pipeline value calculations
- **Activity Tracking**: Meeting, call, email, and other activity types with scheduled dates and outcomes (planned, completed, cancelled, no_show)
- **Notes Management**: Internal (team only) and shared (customer visible) notes with timestamps
- **Kanban Board UI**: Visual pipeline management with drag-to-stage and quick actions
- **Pipeline Statistics**: Real-time dashboard showing total value, weighted value, won count, and active opportunities

### Contract Type System
- **Template Types**: Two predefined templates (Managed Contract, Cost-Plus Contract)
- **JSON Schema Compliance**: Full implementation with JSONB arrays (performanceKpis, subcontractors) and enum validations (paymentModel, reportingFrequency, markupType, paymentFrequency)
- **Managed Contracts**: Include fields for service scope, performance KPIs (array), payment model (enum), fees (decimal), reporting/governance frequency (enum), bonus/penalty rules, and change management
- **Cost-Plus Contracts**: Include fields for cost base definition, markup type/value (enum + decimal), payment frequency (enum), documentation requirements, cost cap (decimal), audit rights (boolean), and risk sharing
- **Default Contract Types**: Two contract types auto-initialized on startup with Danish specifications and proper data types
- **Customer Integration**: Optional contract type assignment when creating/editing customers
- **Data Persistence**: Currently using in-memory storage; contract types recreate on server restart with consistent data
- **Form Handling**: Dropdowns use enum values with Danish labels, arrays handled as comma-separated strings in UI

### Location Management Enhancements
- **Comprehensive Address Fields**: Street, street number, zip code, and city for complete address capture
- **Contact Management**: Main phone for location, separate from contact person details
- **Categorization**: Optional category field for organizing locations (Office, Warehouse, Retail, etc.)
- **Enhanced Contact Person**: Name, email, phone, and role fields for local facility contacts
- **Bulk Operations**: Improved bulk add service modules dialog with scrollable template list (max-height: 50vh) ensuring all templates are accessible
- **Display Integration**: All new fields properly displayed in location detail views with organized sections

### Service Map & Scope Configuration Module (MODULE B)
- **Service Map Overview**: Visual dashboard displaying the Customer → Location → Module hierarchy across the entire portfolio
- **Three View Modes**:
  - **Grid View**: Card-based layout showing customers with location summaries and top modules per location with status indicators
  - **List View**: Tabular format with columns for Customer, Location, Module ID, Template, Category, and Status - all with clickable navigation
  - **Tree View**: Hierarchical expandable view for drilling down from customers to locations to individual modules
- **Statistics Dashboard**: Real-time counts for total customers, locations, service modules, and overdue services
- **Filtering**: Filter by customer, category, and search by module ID or location name
- **Status Visualization**: Color-coded status indicators (green=active, yellow=pending, red=overdue, gray=inactive)
- **Navigation Integration**: Map icon in sidebar, links to customer/location/module detail pages from all views
- **Bulk Operations**: Existing bulk add service modules feature in location detail view for rapid scope definition

### Procurement & Vendor Benchmarking Module (MODULE C)
- **RFQ Management**: Create and manage Request for Quotes with full lifecycle tracking (draft → sent → receiving_quotes → evaluating → awarded)
- **Supplier Invitations**: Invite multiple suppliers to RFQs with minimum 3 suppliers required before sending
- **Quote Collection**: Receive and track supplier quotes with pricing, delivery times, quality scores, compliance scores, and ESG scores
- **Benchmark Engine**: Weighted scoring algorithm comparing quotes based on configurable weights for price (default 40%), quality (30%), delivery (15%), and compliance (15%)
- **Quote Rankings**: Automatic calculation of overall rank and price rank for all received quotes
- **Award Workflow**: Select winning supplier with reason documentation and automatic rejection of other quotes
- **Activity Logging**: Full audit trail for RFQ creation, updates, sending, and awarding
- **Service Module Linking**: Associate RFQs with specific service modules or templates
- **Sales Case Integration**: Optional linking of RFQs to existing sales cases for end-to-end tracking

## External Dependencies

### Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage for file uploads and documents
- **Replit Infrastructure**: Development environment with sidecar services

### UI and Component Libraries
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for consistent iconography
- **Uppy**: File upload handling with progress tracking and cloud integration

### Development and Build Tools
- **Vite**: Fast development server and build tool with HMR
- **TypeScript**: Static type checking across the entire stack
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Drizzle Kit**: Database schema management and migration tools
- **ESBuild**: Fast JavaScript bundler for production server builds

### Data Management
- **TanStack Query**: Server state synchronization with caching and optimization
- **React Hook Form**: Form state management with validation integration
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities