# MatriXx360 - System Architecture & Specification

## Overview
MatriXx360 is a comprehensive facility management platform for organizations like CBRE to manage service modules across multiple customer sites with full lifecycle tracking, cost monitoring, and compliance management.

## Core Domain Model

### Customer (Kunde)
- **Purpose**: Top-level entity representing a client organization
- **Attributes**:
  - Name, CVR number
  - Contact information
  - Branding/logo
- **Relationships**: Has many Sites (Locations)

### Sites / Business Units (Locations / Enheder)
- **Purpose**: Physical locations/buildings where services are delivered
- **Note**: In Danish UI, these are called "Enheder" (Units/Business Units)
- **Attributes**:
  - Name, address
  - GPS coordinates
  - Contact persons
- **Relationships**: 
  - Belongs to Customer
  - Has many Service Modules

### Service Modules
**Core entity representing individual service units (elevators, cleaning contracts, etc.)**

#### Stamdata (Master Data)
- Code / Name
- Customer
- Site (Location)
- Category (Elevator, Escalator, Cleaning, Canteen, Technical services)
- Supplier
- Status: `Prospect | In Transition | Active`
- Service dates (last/next)
- Interval (days between services)
- Budget (monthly/YTD)
- SLA (response time/repair time)

#### Template Binding
- **ModuleTemplate**: Links to template type (Elevator, Escalator, etc.)
- **TemplateVersion**: Specific version of template used
- **Data completeness**: Percentage of required fields filled

#### Dynamic Fields
- **TemplateSection**: Grouped field categories (Identity, Technical, Compliance, etc.)
- **FieldDefinition**: Individual field specifications
- **FieldValue**: Actual values for this specific module

### Service Events
**Tracks all service-related activities**

Types:
- **Planned service**: Scheduled maintenance
- **Mandatory inspection**: Required compliance checks
- **Breakdown**: Unplanned failures/repairs
- **Report upload**: Documentation attachments

### Costs
**Financial tracking per service module**

- **Invoice**: Individual cost entries
  - Date
  - Amount
  - Category
- **Cost vs Budget**: Comparison and variance tracking
- **Variance**: Over/under budget analysis

### Monitoring & Alarms
**Proactive alerting system**

Alarm Types:
- Service due (upcoming deadline)
- Service overdue (missed deadline)
- Over budget (cost exceeded)
- Underperforming SLA (response/repair time violations)

## Templates System

### ModuleTemplate
**Defines service module types**

Standard Templates:
- Elevator
- Escalator
- Cleaning
- Canteen
- Technical services

### TemplateVersion
**Versioned template definitions with structured sections**

#### Standard Sections:
1. **Identity**: Basic identification fields
2. **Technical**: Equipment specifications
3. **Compliance**: Regulatory requirements
4. **SLA/KPI**: Service level agreements and metrics
5. **Economy**: Cost and budget information
6. **Supplier**: Vendor management data

#### FieldDefinition Properties:
- **Datatype**: text, number, date, dropdown, checkbox, etc.
- **Required**: Mandatory vs optional
- **VisibleIf**: Conditional visibility rules
- **OptionSet**: Predefined choices for dropdown fields
- **Unit**: Measurement units (kg, m, hours, etc.)

## Workflow States

### Customer Onboarding Workflow
**CRITICAL: Fast and efficient customer setup process**

#### Step 1: Create Customer
- Enter basic customer information (name, CVR, contact)

#### Step 2: Create Business Units (Bulk)
- Create multiple business units under the customer in one flow
- For each unit: name, address, GPS coordinates, contact persons

#### Step 3: Add Service Modules (Template-based Batch Creation)
- **Drag-and-drop or select from categories**:
  - "I need 5 Elevator modules for this unit"
  - "I need 3 Escalator modules for this unit"
  - "I need 2 Cleaning modules for this unit"
- System creates placeholder service modules based on templates
- Modules are created with minimal data (category, template binding)
- Data completeness initially low (e.g., 20%)

#### Step 4: Complete Module Details (Later)
- Go into each service module individually
- Fill in dynamic fields from template
- Add supplier, budget, SLA, technical specs
- Data completeness increases as fields are filled

#### Key Principle: "Create Fast, Define Later"
- **First pass**: Quickly establish structure (customer → units → module placeholders)
- **Second pass**: Detailed specification of each module
- **Dashboard tracking**: Shows which modules need completion

### Transition Phase
**Onboarding new service modules**

Process:
1. Scope frozen (requirements locked)
2. Supplier kickoff (vendor engagement)
3. Service calendar (schedule setup)
4. Readiness board (go-live checklist)

## Reporting

### Dashboards
- **Service compliance**: On-time service delivery metrics
- **Cost development**: Budget vs actual over time
- **Alarm overview**: Active alerts and trends

### Exports
- **Contract appendix**: Service module documentation for contracts
- **SOW per module**: Scope of Work documents

## Current Implementation Status

### ✅ Implemented
- Customer management (CRUD)
- Locations (Sites) management
  - Single location creation
  - **NEW**: Bulk location creation endpoint (POST /api/locations/bulk)
- Service Templates (basic structure)
- Service Categories
- Service Modules (basic stamdata)
- Suppliers
- Deep navigation hierarchy: Customer → Location → Category → Module

### 🚧 Partially Implemented
- Dynamic template fields (schema exists, UI incomplete)
- Service module creation (basic form, needs dynamic fields)

### ❌ Not Yet Implemented
- Service Events
- Costs & Invoices
- Monitoring & Alarms
- Transition workflow
- Reporting & Dashboards
- Template versioning
- Field conditional logic (VisibleIf)
- Data completeness tracking
- SLA tracking

## Technical Architecture

### Frontend
- React 18 + TypeScript
- shadcn/ui components
- TanStack Query for state management
- Wouter for routing

### Backend
- Express.js + TypeScript
- Drizzle ORM
- PostgreSQL (Neon)
- Google Cloud Storage for files

### Database Schema
See `shared/schema.ts` for current data models

## Navigation Structure

Current hierarchy:
```
Dashboard
├── Customers
│   └── Customer Detail
│       └── Locations (Sites)
│           └── Location Detail
│               └── Service Categories
│                   └── Category Detail
│                       └── Individual Modules
│                           └── Module Detail (planned)
├── Service Templates
├── Service Modules (flat view)
└── Suppliers
```

## Next Steps Priority

1. **Complete Service Module Detail View**
   - Display all stamdata
   - Edit capabilities
   - Dynamic field rendering based on template

2. **Implement Service Events**
   - Planned service scheduling
   - Breakdown reporting
   - Event history

3. **Add Cost Tracking**
   - Invoice entry
   - Budget vs actual
   - Variance reporting

4. **Build Monitoring/Alarms**
   - Service due alerts
   - Budget warnings
   - SLA violations

5. **Create Dashboard Analytics**
   - Service compliance metrics
   - Cost trends
   - Alarm summary
