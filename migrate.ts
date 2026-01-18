import { pool } from "./db";

const dropTablesSQL = `
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS transition_tasks CASCADE;
DROP TABLE IF EXISTS transitions CASCADE;
DROP TABLE IF EXISTS proposal_line_items CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS rfq_quotes CASCADE;
DROP TABLE IF EXISTS rfq_suppliers CASCADE;
DROP TABLE IF EXISTS rfq_service_modules CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS sales_case_modules CASCADE;
DROP TABLE IF EXISTS sales_notes CASCADE;
DROP TABLE IF EXISTS sales_activities CASCADE;
DROP TABLE IF EXISTS sales_cases CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS service_modules CASCADE;
DROP TABLE IF EXISTS service_templates CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS contact_persons CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS contract_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
`;

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_types (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  service_scope TEXT,
  performance_kpis JSONB,
  payment_model TEXT,
  fee_amount DECIMAL(12, 2),
  bonus_penalty_rules TEXT,
  reporting_frequency TEXT,
  governance_frequency TEXT,
  change_management_process TEXT,
  subcontractors JSONB,
  cost_base_definition TEXT,
  markup_type TEXT,
  markup_value DECIMAL(12, 2),
  cost_cap DECIMAL(12, 2),
  documentation_requirements TEXT,
  payment_frequency TEXT,
  audit_rights BOOLEAN,
  bonus_criteria TEXT,
  risk_sharing_agreement TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  street TEXT,
  street_number TEXT,
  city TEXT,
  zip_code TEXT,
  main_phone TEXT,
  category TEXT,
  cvr_number TEXT,
  main_contact_name TEXT,
  main_contact_email TEXT,
  main_contact_phone TEXT,
  main_contact_role TEXT,
  contract_type_id VARCHAR REFERENCES contract_types(id),
  logo_path TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  name TEXT NOT NULL,
  street TEXT,
  street_number TEXT,
  city TEXT,
  zip_code TEXT,
  main_phone TEXT,
  category TEXT,
  main_contact_name TEXT,
  main_contact_email TEXT,
  main_contact_phone TEXT,
  main_contact_role TEXT,
  number_of_dishes INTEGER,
  number_of_canteen_users INTEGER,
  meal_size_grams INTEGER,
  cost_per_meal DECIMAL(10, 2),
  vegetarian BOOLEAN DEFAULT false,
  organic BOOLEAN DEFAULT false,
  fast_food BOOLEAN DEFAULT false,
  warm BOOLEAN DEFAULT false,
  nutritional_info JSONB DEFAULT '[]',
  organic_products_percentage INTEGER DEFAULT 0,
  earnings_model TEXT,
  cost_plus_level TEXT,
  bonus_models JSONB DEFAULT '[]',
  kpis_measured TEXT,
  agreed_level TEXT,
  gps_coordinates TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_persons (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR REFERENCES locations(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  category_id VARCHAR REFERENCES service_categories(id) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cvr_number TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  contact_persons JSONB DEFAULT '[]',
  categories JSONB NOT NULL DEFAULT '[]',
  quality_rating DECIMAL(2, 1) DEFAULT 0,
  price_rating DECIMAL(2, 1) DEFAULT 0,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_modules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  location_id VARCHAR REFERENCES locations(id) NOT NULL,
  template_id VARCHAR REFERENCES service_templates(id) NOT NULL,
  category_id VARCHAR REFERENCES service_categories(id) NOT NULL,
  supplier_id VARCHAR REFERENCES suppliers(id),
  responsible_user_id VARCHAR REFERENCES users(id),
  field_values JSONB NOT NULL DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  next_service_date TIMESTAMP,
  last_service_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id VARCHAR NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_cases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id),
  owner_user_id VARCHAR REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  probability INTEGER DEFAULT 10,
  estimated_value DECIMAL(12, 2),
  expected_close_date TIMESTAMP,
  closed_at TIMESTAMP,
  closed_reason TEXT,
  linked_proposal_id VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_activities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_case_id VARCHAR REFERENCES sales_cases(id) NOT NULL,
  owner_user_id VARCHAR REFERENCES users(id),
  activity_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP,
  duration_minutes INTEGER,
  outcome TEXT DEFAULT 'planned',
  outcome_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_notes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_case_id VARCHAR REFERENCES sales_cases(id) NOT NULL,
  author_user_id VARCHAR REFERENCES users(id),
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'internal',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_case_modules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_case_id VARCHAR REFERENCES sales_cases(id) NOT NULL,
  service_module_id VARCHAR REFERENCES service_modules(id),
  template_id VARCHAR REFERENCES service_templates(id),
  category_id VARCHAR REFERENCES service_categories(id),
  preliminary_name TEXT,
  estimated_quantity INTEGER DEFAULT 1,
  is_preliminary BOOLEAN DEFAULT true,
  confidence_level INTEGER DEFAULT 50,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- MODULE C: PROCUREMENT & VENDOR BENCHMARKING TABLES

CREATE TABLE IF NOT EXISTS rfqs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id),
  location_id VARCHAR REFERENCES locations(id),
  sales_case_id VARCHAR REFERENCES sales_cases(id),
  title TEXT NOT NULL,
  description TEXT,
  category_id VARCHAR REFERENCES service_categories(id),
  status TEXT NOT NULL DEFAULT 'draft',
  deadline TIMESTAMP,
  sent_at TIMESTAMP,
  closed_at TIMESTAMP,
  awarded_supplier_id VARCHAR REFERENCES suppliers(id),
  award_reason TEXT,
  price_weight INTEGER DEFAULT 40,
  quality_weight INTEGER DEFAULT 30,
  delivery_weight INTEGER DEFAULT 15,
  compliance_weight INTEGER DEFAULT 15,
  created_by_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_service_modules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id VARCHAR REFERENCES rfqs(id) NOT NULL,
  service_module_id VARCHAR REFERENCES service_modules(id),
  template_id VARCHAR REFERENCES service_templates(id),
  description TEXT,
  quantity INTEGER DEFAULT 1,
  technical_requirements TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_suppliers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id VARCHAR REFERENCES rfqs(id) NOT NULL,
  supplier_id VARCHAR REFERENCES suppliers(id) NOT NULL,
  invited_at TIMESTAMP,
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  status TEXT DEFAULT 'pending',
  decline_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_quotes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id VARCHAR REFERENCES rfqs(id) NOT NULL,
  supplier_id VARCHAR REFERENCES suppliers(id) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  price_breakdown JSONB DEFAULT '[]',
  currency TEXT DEFAULT 'DKK',
  delivery_days INTEGER,
  sla_terms TEXT,
  validity_days INTEGER DEFAULT 30,
  quality_score DECIMAL(4, 2),
  compliance_score DECIMAL(4, 2),
  esg_score DECIMAL(4, 2),
  documents JSONB DEFAULT '[]',
  notes TEXT,
  supplier_notes TEXT,
  status TEXT DEFAULT 'pending',
  benchmark_score DECIMAL(5, 2),
  price_rank INTEGER,
  overall_rank INTEGER,
  submitted_at TIMESTAMP,
  evaluated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- MODULE D: PROPOSALS & CONTRACTS

CREATE TABLE IF NOT EXISTS proposals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  sales_case_id VARCHAR REFERENCES sales_cases(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(12, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'DKK',
  contract_duration_months INTEGER DEFAULT 12,
  payment_terms_days INTEGER DEFAULT 30,
  valid_until TIMESTAMP,
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  customer_notes TEXT,
  rejection_reason TEXT,
  documents JSONB DEFAULT '[]',
  created_by_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_line_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id VARCHAR REFERENCES proposals(id) NOT NULL,
  service_module_id VARCHAR REFERENCES service_modules(id),
  category_id VARCHAR REFERENCES service_categories(id),
  template_id VARCHAR REFERENCES service_templates(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'stk',
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  sla_level TEXT,
  sla_details TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  proposal_id VARCHAR REFERENCES proposals(id),
  contract_type_id VARCHAR REFERENCES contract_types(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  total_value DECIMAL(12, 2),
  currency TEXT DEFAULT 'DKK',
  payment_terms_days INTEGER DEFAULT 30,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 90,
  sla_definitions JSONB DEFAULT '[]',
  signed_by_customer BOOLEAN DEFAULT false,
  customer_signature_date TIMESTAMP,
  customer_signature_name TEXT,
  signed_by_company BOOLEAN DEFAULT false,
  company_signature_date TIMESTAMP,
  company_signature_name TEXT,
  documents JSONB DEFAULT '[]',
  created_by_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- MODULE E: TRANSITIONS

CREATE TABLE IF NOT EXISTS transitions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  contract_id VARCHAR REFERENCES contracts(id),
  sales_case_id VARCHAR REFERENCES sales_cases(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  planned_start_date TIMESTAMP,
  planned_end_date TIMESTAMP,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  lead_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transition_tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_id VARCHAR REFERENCES transitions(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_user_id VARCHAR REFERENCES users(id),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  completed_by_user_id VARCHAR REFERENCES users(id),
  sort_order INTEGER DEFAULT 0,
  depends_on_task_id VARCHAR,
  notes TEXT,
  blocked_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- MODULE F: WORK ORDERS, SERVICE LOGS, INCIDENTS

CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  location_id VARCHAR REFERENCES locations(id) NOT NULL,
  service_module_id VARCHAR REFERENCES service_modules(id),
  supplier_id VARCHAR REFERENCES suppliers(id),
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT NOT NULL DEFAULT 'maintenance',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date TIMESTAMP,
  scheduled_end_date TIMESTAMP,
  estimated_duration_minutes INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_duration_minutes INTEGER,
  assigned_user_id VARCHAR REFERENCES users(id),
  completion_notes TEXT,
  parts_used JSONB DEFAULT '[]',
  labor_cost DECIMAL(12, 2),
  parts_cost DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  documents JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  service_module_id VARCHAR REFERENCES service_modules(id) NOT NULL,
  work_order_id VARCHAR REFERENCES work_orders(id),
  log_type TEXT NOT NULL DEFAULT 'service',
  description TEXT NOT NULL,
  technician_user_id VARCHAR REFERENCES users(id),
  technician_name TEXT,
  outcome TEXT,
  readings_values JSONB DEFAULT '{}',
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  service_date TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT NOT NULL UNIQUE,
  customer_id VARCHAR REFERENCES customers(id) NOT NULL,
  location_id VARCHAR REFERENCES locations(id) NOT NULL,
  service_module_id VARCHAR REFERENCES service_modules(id),
  work_order_id VARCHAR REFERENCES work_orders(id),
  title TEXT NOT NULL,
  description TEXT,
  incident_type TEXT NOT NULL DEFAULT 'issue',
  priority TEXT NOT NULL DEFAULT 'medium',
  severity TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'open',
  sla_breached BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP,
  resolution_deadline TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by_user_id VARCHAR REFERENCES users(id),
  resolution TEXT,
  root_cause TEXT,
  preventive_action TEXT,
  assigned_user_id VARCHAR REFERENCES users(id),
  escalated_at TIMESTAMP,
  escalated_to_user_id VARCHAR REFERENCES users(id),
  escalation_reason TEXT,
  reported_by_name TEXT,
  reported_by_email TEXT,
  reported_by_phone TEXT,
  documents JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
`;

export async function runMigration(): Promise<void> {
  console.log('Running database migration...');
  try {
    // Check if we have the latest schema (work_orders table for MODULE F)
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'work_orders'
      ) as has_work_orders
    `);
    
    const hasLatestSchema = result.rows[0]?.has_work_orders === true;
    
    if (!hasLatestSchema) {
      console.log('Schema needs update, dropping and recreating tables...');
      await pool.query(dropTablesSQL);
    }
    
    await pool.query(createTablesSQL);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
