# MatriXx360 Design Guidelines

## Design Approach: Carbon Design System Foundation

Selected for its enterprise-grade, data-intensive application patterns. Carbon excels at productivity tools with complex workflows, extensive forms, and dense information displays.

**Core Principles:**
- Efficiency over aesthetics: Every element serves a functional purpose
- Scannable hierarchy: Information organized for rapid comprehension
- Predictable patterns: Consistent interactions reduce cognitive load
- Progressive disclosure: Show complexity only when needed

---

## Typography System

**Font Family:** IBM Plex Sans (via Google Fonts CDN)
- Primary: IBM Plex Sans for UI elements
- Monospace: IBM Plex Mono for data/codes

**Type Scale:**
- Hero/Page Titles: text-4xl (36px) font-semibold
- Section Headers: text-2xl (24px) font-semibold
- Subsection Headers: text-lg (18px) font-medium
- Body Text: text-sm (14px) font-normal
- Labels/Captions: text-xs (12px) font-medium uppercase tracking-wide
- Data Display: text-base (16px) font-mono

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card margins: gap-4 to gap-6
- Form field spacing: space-y-4

**Grid Structure:**
- Sidebar navigation: Fixed 16rem (256px) width
- Main content: Full remaining width with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Form layouts: Two-column on desktop (grid-cols-2), single on mobile
- Data tables: Full-width with horizontal scroll on mobile

---

## Component Library

### Navigation & Layout

**Top Bar (h-16):**
- Logo left, breadcrumb navigation center, user profile/notifications right
- Search bar (w-96) with icon, placed prominently
- Quick actions dropdown for frequently used operations

**Sidebar Navigation (w-64):**
- Primary sections: Dashboard, Customers, Business Units, Service Modules, Suppliers, Templates
- Nested subnav for active sections with indentation (pl-8)
- Section dividers with text-xs labels
- Active state: Filled background with left border accent

**Dashboard Layout:**
- Stats cards row (4 cards): Customer count, Active locations, Service modules, Pending tasks
- Recent activity table (8 rows visible, paginated)
- Quick action buttons: "New Customer", "Bulk Import Units", "Create Template"

### Forms & Data Entry

**Multi-Step Wizard (Onboarding/Bulk Creation):**
- Progress indicator: Horizontal stepper with numbered circles
- Steps: (1) Customer Details → (2) Add Business Units → (3) Configure Service Modules → (4) Review
- Navigation: "Back", "Save Draft", "Continue" buttons bottom-right
- Step 2 & 3: Inline table editor with "+ Add Row" functionality

**Inline Table Editor (Bulk Business Unit Entry):**
- Headers: Location Name, Address, Type, Square Footage, Contact
- Each row: Input fields inline, delete icon right
- "+ Add 5 More Rows" button below table
- Template dropdown: "Apply template to selected" for batch operations

**Service Module Configuration:**
- Left panel: Service type selector (Elevators, Escalators, HVAC, Cleaning, Security)
- Right panel: Dynamic form based on selection
- Checkbox list for selecting multiple business units to apply services
- "Batch Apply" button with count indicator (e.g., "Apply to 12 locations")

**Standard Forms:**
- Field groups with subtle background (bg-gray-50)
- Labels: font-medium text-xs uppercase mb-1
- Required indicator: Red asterisk inline with label
- Input fields: h-10, border-2, rounded-md, focus:ring-2
- Helper text: text-xs text-gray-600 mt-1
- Error state: Red border, error icon, error message below

### Data Display

**Data Tables:**
- Sticky header row with bg-gray-100
- Row height: h-12 with vertical dividers
- Alternating row backgrounds for scannability
- Hover state: Subtle background change
- Action column: Right-aligned icon buttons (View, Edit, Delete)
- Bulk selection: Checkboxes left column with select-all header
- Inline search/filter controls above table
- Pagination: Bottom-right with "Showing X-Y of Z results"

**Detail Views (Master-Detail Pattern):**
- Split layout: 40% list panel (left), 60% detail panel (right)
- List panel: Scrollable list with search, filters at top
- Detail panel: Tabbed interface (Overview, Services, Contracts, History)
- Tab content: Organized in cards with section headers

**Cards:**
- White background, border, rounded-lg
- Header: flex justify-between with title and action icon
- Content: p-6 with consistent spacing
- Footer (if applicable): border-top with action buttons

### Modals & Overlays

**Quick-Add Modal (Fast Data Entry):**
- Compact modal (max-w-lg) with essential fields only
- "Add & Continue" button creates record and clears form
- "Add & Close" saves and closes
- Recent additions shown in sidebar of modal (last 5)

**Confirmation Dialogs:**
- Centered overlay (max-w-md)
- Icon at top (warning/success/info)
- Clear action buttons with primary action right-aligned
- Secondary "Cancel" button left

**Slide-Over Panel (Details/Specifications):**
- Slides from right, w-96 to w-1/3 viewport
- Close icon top-right
- Scrollable content with fixed header
- Action buttons sticky at bottom

### Buttons & Actions

**Button Hierarchy:**
- Primary: Filled, h-10, px-6, rounded-md, font-medium
- Secondary: Outlined, same dimensions
- Tertiary: Ghost (text only) with padding
- Icon buttons: Square (w-10 h-10), rounded-md
- Button groups: Joined with rounded corners on ends only

**Floating Action Button (FAB):**
- Bottom-right corner (fixed)
- "+" icon with label on hover
- Opens quick-action menu with: New Customer, New Location, New Service

---

## Images

**Hero Image (Login/Welcome Page):**
- Full-width hero section (h-screen on desktop, h-96 on mobile)
- Professional facility management imagery: Modern commercial building exterior or interior facility control room with monitors showing building systems
- Image treatment: Subtle dark overlay (opacity-40) for text readability
- Centered content with company logo, tagline "Enterprise Facility Management Platform", and login form card
- Login card: max-w-md, white background, elevated shadow, positioned center-right of hero

**Empty States:**
- Illustration or icon-based graphics for empty data tables
- Example: "No business units yet" with building icon and "Add First Location" CTA
- Maintain professional, minimal illustration style

---

## Key Interactions

**Keyboard Shortcuts:**
- Global search: Cmd/Ctrl + K
- New customer: Cmd/Ctrl + N
- Quick save: Cmd/Ctrl + S
- Display shortcut hints on hover for power users

**Drag & Drop:**
- Reorder service priority in lists
- Bulk upload: Drag CSV files into designated zones
- Visual feedback: Dashed border, upload icon, file preview

**Autosave Indicators:**
- "Saving..." spinner in form headers
- "All changes saved" confirmation with checkmark
- Timestamp of last save in form footer