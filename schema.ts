import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("technician"), // admin, manager, technician
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const contractTypes = pgTable("contract_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  templateType: text("template_type").notNull(), // 'managed' | 'cost-plus'
  
  // Managed Contract fields
  serviceScope: text("service_scope"),
  performanceKpis: jsonb("performance_kpis").$type<string[]>(), // Array of KPI strings
  paymentModel: text("payment_model"), // enum: 'fixed-monthly', 'per-unit', 'hybrid', 'other'
  feeAmount: decimal("fee_amount", { precision: 12, scale: 2 }),
  bonusPenaltyRules: text("bonus_penalty_rules"),
  reportingFrequency: text("reporting_frequency"), // enum: 'weekly', 'monthly', 'quarterly', 'yearly', 'other'
  governanceFrequency: text("governance_frequency"),
  changeManagementProcess: text("change_management_process"),
  subcontractors: jsonb("subcontractors").$type<string[]>(), // Array of subcontractor names
  
  // Cost-Plus Contract fields
  costBaseDefinition: text("cost_base_definition"),
  markupType: text("markup_type"), // enum: 'percent', 'fixed'
  markupValue: decimal("markup_value", { precision: 12, scale: 2 }),
  costCap: decimal("cost_cap", { precision: 12, scale: 2 }),
  documentationRequirements: text("documentation_requirements"),
  paymentFrequency: text("payment_frequency"), // enum: 'monthly', 'quarterly', 'on-completion', 'other'
  auditRights: boolean("audit_rights"),
  bonusCriteria: text("bonus_criteria"),
  riskSharingAgreement: text("risk_sharing_agreement"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Basic customer information
  name: text("name").notNull(),
  street: text("street"),
  streetNumber: text("street_number"),
  city: text("city"),
  zipCode: text("zip_code"),
  mainPhone: text("main_phone"),
  category: text("category"),
  cvrNumber: text("cvr_number"),
  
  // Main contact information
  mainContactName: text("main_contact_name"),
  mainContactEmail: text("main_contact_email"),
  mainContactPhone: text("main_contact_phone"),
  mainContactRole: text("main_contact_role"),
  
  // Contract type reference
  contractTypeId: varchar("contract_type_id").references(() => contractTypes.id),
  
  // Legacy fields
  logoPath: text("logo_path"), // Object storage path
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Basic location information (using 'name' for location name)
  name: text("name").notNull(), // Location name
  street: text("street"),
  streetNumber: text("street_number"),
  city: text("city"),
  zipCode: text("zip_code"),
  mainPhone: text("main_phone"),
  category: text("category"),
  
  // Main contact information for this location
  mainContactName: text("main_contact_name"),
  mainContactEmail: text("main_contact_email"),
  mainContactPhone: text("main_contact_phone"),
  mainContactRole: text("main_contact_role"),
  
  // Business unit and contact information now managed via contactPersons table
  
  // Location-specific preferences
  numberOfDishes: integer("number_of_dishes"),
  numberOfCanteenUsers: integer("number_of_canteen_users"),
  mealSizeGrams: integer("meal_size_grams"),
  costPerMeal: decimal("cost_per_meal", { precision: 10, scale: 2 }),
  
  // Dish types
  vegetarian: boolean("vegetarian").default(false),
  organic: boolean("organic").default(false),
  fastFood: boolean("fast_food").default(false),
  warm: boolean("warm").default(false),
  
  // Nutritional information (stored as JSONB for flexibility)
  nutritionalInfo: jsonb("nutritional_info").default([]), // Array of dish type nutrition data
  
  // Organic products percentage
  organicProductsPercentage: integer("organic_products_percentage").default(0),
  
  // Financial impacts
  earningsModel: text("earnings_model"),
  costPlusLevel: text("cost_plus_level"),
  bonusModels: jsonb("bonus_models").default([]), // Array of bonus model objects
  kpisMeasured: text("kpis_measured"),
  agreedLevel: text("agreed_level"),
  
  // Legacy fields
  gpsCoordinates: text("gps_coordinates"), // JSON string: {lat, lng}
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const contactPersons = pgTable("contact_persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  
  // Contact person information
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull(), // Manager, Technician, Chef, Administrator, etc.
  
  // Additional details
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const serviceCategories = pgTable("service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const serviceTemplates = pgTable("service_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateName: text("template_name").notNull(),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // Array of field definitions
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cvrNumber: text("cvr_number"),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  contactPersons: jsonb("contact_persons").default([]), // Array of contact person objects
  categories: jsonb("categories").notNull().default([]), // Array of category IDs
  qualityRating: decimal("quality_rating", { precision: 2, scale: 1 }).default("0"),
  priceRating: decimal("price_rating", { precision: 2, scale: 1 }).default("0"),
  documents: jsonb("documents").default([]), // Array of document objects
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const serviceModules = pgTable("service_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: text("module_id").notNull().unique(), // Human-readable ID like MOD-001
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  templateId: varchar("template_id").references(() => serviceTemplates.id).notNull(),
  categoryId: varchar("category_id").references(() => serviceCategories.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  responsibleUserId: varchar("responsible_user_id").references(() => users.id),
  fieldValues: jsonb("field_values").notNull().default({}), // Dynamic field values
  documents: jsonb("documents").default([]), // Array of document objects
  nextServiceDate: timestamp("next_service_date"),
  lastServiceDate: timestamp("last_service_date"),
  status: text("status").notNull().default("active"), // active, overdue, completed, inactive
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // customer, location, module, supplier, etc.
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // created, updated, completed, etc.
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Sales Case Status enum
export const salesCaseStatusEnum = z.enum(['lead', 'discovery', 'proposal', 'negotiation', 'won', 'lost']);
export type SalesCaseStatus = z.infer<typeof salesCaseStatusEnum>;

// Sales Activity Type enum
export const salesActivityTypeEnum = z.enum(['meeting', 'call', 'email', 'site_visit', 'other']);
export type SalesActivityType = z.infer<typeof salesActivityTypeEnum>;

// Sales Activity Outcome enum
export const salesActivityOutcomeEnum = z.enum(['planned', 'completed', 'cancelled', 'rescheduled']);
export type SalesActivityOutcome = z.infer<typeof salesActivityOutcomeEnum>;

// Sales Cases - represents the entire sales process for a customer
export const salesCases = pgTable("sales_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(), // Human-readable ID like SC-001
  customerId: varchar("customer_id").references(() => customers.id),
  ownerUserId: varchar("owner_user_id").references(() => users.id),
  
  // Case details
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("lead"), // lead, discovery, proposal, negotiation, won, lost
  
  // Pipeline metrics
  probability: integer("probability").default(10), // 0-100%
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  expectedCloseDate: timestamp("expected_close_date"),
  
  // Won/Lost details
  closedAt: timestamp("closed_at"),
  closedReason: text("closed_reason"),
  
  // Linked entities
  linkedProposalId: varchar("linked_proposal_id"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Sales Activities - meetings, calls, emails, site visits
export const salesActivities = pgTable("sales_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id).notNull(),
  ownerUserId: varchar("owner_user_id").references(() => users.id),
  
  // Activity details
  activityType: text("activity_type").notNull(), // meeting, call, email, site_visit, other
  subject: text("subject").notNull(),
  description: text("description"),
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  durationMinutes: integer("duration_minutes"),
  
  // Outcome
  outcome: text("outcome").default("planned"), // planned, completed, cancelled, rescheduled
  outcomeNotes: text("outcome_notes"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Sales Notes - internal notes on sales cases
export const salesNotes = pgTable("sales_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id).notNull(),
  authorUserId: varchar("author_user_id").references(() => users.id),
  
  // Note content
  content: text("content").notNull(),
  visibility: text("visibility").default("internal"), // internal, shared (with customer)
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Junction table for linking service modules to sales cases (preliminary scoping)
export const salesCaseModules = pgTable("sales_case_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id).notNull(),
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id),
  
  // For preliminary modules that don't exist yet
  templateId: varchar("template_id").references(() => serviceTemplates.id),
  categoryId: varchar("category_id").references(() => serviceCategories.id),
  preliminaryName: text("preliminary_name"),
  estimatedQuantity: integer("estimated_quantity").default(1),
  
  isPreliminary: boolean("is_preliminary").default(true),
  confidenceLevel: integer("confidence_level").default(50), // 0-100%
  notes: text("notes"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertContactPersonSchema = createInsertSchema(contactPersons).omit({
  id: true,
  createdAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).omit({
  id: true,
  createdAt: true,
});

export const insertServiceTemplateSchema = createInsertSchema(serviceTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertServiceModuleSchema = createInsertSchema(serviceModules).omit({
  id: true,
  moduleId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

export const insertSalesCaseSchema = createInsertSchema(salesCases).omit({
  id: true,
  caseNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: salesCaseStatusEnum.optional(),
  estimatedValue: z.string().optional().nullable(),
  expectedCloseDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : (typeof val === "string" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
  closedAt: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : (typeof val === "string" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
});

export const insertSalesActivitySchema = createInsertSchema(salesActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  activityType: salesActivityTypeEnum,
  outcome: salesActivityOutcomeEnum.optional(),
  scheduledDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : (typeof val === "string" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
  completedAt: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : (typeof val === "string" ? new Date(val) : val),
    z.date().optional().nullable()
  ),
});

export const insertSalesNoteSchema = createInsertSchema(salesNotes).omit({
  id: true,
  createdAt: true,
});

export const insertSalesCaseModuleSchema = createInsertSchema(salesCaseModules).omit({
  id: true,
  createdAt: true,
});

// Contract type enums
export const paymentModelEnum = z.enum(['fixed-monthly', 'per-unit', 'hybrid', 'other']);
export const reportingFrequencyEnum = z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'other']);
export const markupTypeEnum = z.enum(['percent', 'fixed']);
export const paymentFrequencyEnum = z.enum(['monthly', 'quarterly', 'on-completion', 'other']);

export const insertContractTypeSchema = createInsertSchema(contractTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  templateType: z.enum(['managed', 'cost-plus']),
  // Managed contract validations
  performanceKpis: z.array(z.string()).min(1).optional().nullable(),
  paymentModel: paymentModelEnum.optional().nullable(),
  feeAmount: z.string().optional().nullable(), // Decimal comes as string
  reportingFrequency: reportingFrequencyEnum.optional().nullable(),
  subcontractors: z.array(z.string()).optional().nullable(),
  // Cost-Plus contract validations
  markupType: markupTypeEnum.optional().nullable(),
  markupValue: z.string().optional().nullable(), // Decimal comes as string
  costCap: z.string().optional().nullable(), // Decimal comes as string
  paymentFrequency: paymentFrequencyEnum.optional().nullable(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type ContactPerson = typeof contactPersons.$inferSelect;
export type InsertContactPerson = z.infer<typeof insertContactPersonSchema>;

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;

export type ServiceTemplate = typeof serviceTemplates.$inferSelect;
export type InsertServiceTemplate = z.infer<typeof insertServiceTemplateSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type ServiceModule = typeof serviceModules.$inferSelect;
export type InsertServiceModule = z.infer<typeof insertServiceModuleSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type ContractType = typeof contractTypes.$inferSelect;
export type InsertContractType = z.infer<typeof insertContractTypeSchema>;

export type SalesCase = typeof salesCases.$inferSelect;
export type InsertSalesCase = z.infer<typeof insertSalesCaseSchema>;

export type SalesActivity = typeof salesActivities.$inferSelect;
export type InsertSalesActivity = z.infer<typeof insertSalesActivitySchema>;

export type SalesNote = typeof salesNotes.$inferSelect;
export type InsertSalesNote = z.infer<typeof insertSalesNoteSchema>;

export type SalesCaseModule = typeof salesCaseModules.$inferSelect;
export type InsertSalesCaseModule = z.infer<typeof insertSalesCaseModuleSchema>;

// Template field types
export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox' | 'file' | 'textarea';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For dropdown fields
  conditionalDisplay?: {
    fieldId: string;
    value: any;
  };
  section?: string; // For grouping fields
}

// ========== MODULE C: PROCUREMENT & VENDOR BENCHMARKING ==========

// RFQ Status enum
export const rfqStatusEnum = z.enum(['draft', 'sent', 'collecting', 'evaluating', 'awarded', 'cancelled']);
export type RfqStatus = z.infer<typeof rfqStatusEnum>;

// Quote Status enum
export const quoteStatusEnum = z.enum(['pending', 'submitted', 'accepted', 'rejected', 'expired']);
export type QuoteStatus = z.infer<typeof quoteStatusEnum>;

// RFQ (Request for Quote) - Main procurement request
export const rfqs = pgTable("rfqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqNumber: text("rfq_number").notNull().unique(), // Human-readable ID like RFQ-001
  
  // Customer and location context
  customerId: varchar("customer_id").references(() => customers.id),
  locationId: varchar("location_id").references(() => locations.id),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id),
  
  // RFQ details
  title: text("title").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => serviceCategories.id),
  
  // Status tracking
  status: text("status").notNull().default("draft"), // draft, sent, collecting, evaluating, awarded, cancelled
  
  // Timeline
  deadline: timestamp("deadline"),
  sentAt: timestamp("sent_at"),
  closedAt: timestamp("closed_at"),
  
  // Award details
  awardedSupplierId: varchar("awarded_supplier_id").references(() => suppliers.id),
  awardReason: text("award_reason"), // Compliance: reason for selecting the supplier
  
  // Benchmark weights (0-100, total should be 100)
  priceWeight: integer("price_weight").default(40),
  qualityWeight: integer("quality_weight").default(30),
  deliveryWeight: integer("delivery_weight").default(15),
  complianceWeight: integer("compliance_weight").default(15),
  
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// RFQ Service Modules - Service modules included in an RFQ
export const rfqServiceModules = pgTable("rfq_service_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").references(() => rfqs.id).notNull(),
  
  // Reference to actual service module or template
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id),
  templateId: varchar("template_id").references(() => serviceTemplates.id),
  
  // Scope details
  description: text("description"),
  quantity: integer("quantity").default(1),
  technicalRequirements: text("technical_requirements"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// RFQ Suppliers - Suppliers invited to quote on an RFQ
export const rfqSuppliers = pgTable("rfq_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").references(() => rfqs.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  
  // Invitation tracking
  invitedAt: timestamp("invited_at"),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  
  // Status
  status: text("status").default("pending"), // pending, viewed, quoted, declined
  declineReason: text("decline_reason"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// RFQ Quotes - Supplier responses/quotes for an RFQ
export const rfqQuotes = pgTable("rfq_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfqId: varchar("rfq_id").references(() => rfqs.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  
  // Pricing
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  priceBreakdown: jsonb("price_breakdown").default([]), // Array of line items
  currency: text("currency").default("DKK"),
  
  // SLA and delivery terms
  deliveryDays: integer("delivery_days"),
  slaTerms: text("sla_terms"),
  validityDays: integer("validity_days").default(30),
  
  // Quality and compliance
  qualityScore: decimal("quality_score", { precision: 4, scale: 2 }), // Internal rating 0-100
  complianceScore: decimal("compliance_score", { precision: 4, scale: 2 }), // Internal rating 0-100
  esgScore: decimal("esg_score", { precision: 4, scale: 2 }), // ESG compliance 0-100
  
  // Documents and notes
  documents: jsonb("documents").default([]), // Attached quote documents
  notes: text("notes"),
  supplierNotes: text("supplier_notes"), // Notes from supplier
  
  // Status
  status: text("status").default("pending"), // pending, submitted, accepted, rejected, expired
  
  // Benchmark calculation (calculated fields)
  benchmarkScore: decimal("benchmark_score", { precision: 5, scale: 2 }), // Weighted overall score
  priceRank: integer("price_rank"),
  overallRank: integer("overall_rank"),
  
  submittedAt: timestamp("submitted_at"),
  evaluatedAt: timestamp("evaluated_at"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Insert schemas for RFQ entities
export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  rfqNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: rfqStatusEnum.optional(),
  priceWeight: z.number().min(0).max(100).optional(),
  qualityWeight: z.number().min(0).max(100).optional(),
  deliveryWeight: z.number().min(0).max(100).optional(),
  complianceWeight: z.number().min(0).max(100).optional(),
});

export const insertRfqServiceModuleSchema = createInsertSchema(rfqServiceModules).omit({
  id: true,
  createdAt: true,
});

export const insertRfqSupplierSchema = createInsertSchema(rfqSuppliers).omit({
  id: true,
  createdAt: true,
});

export const insertRfqQuoteSchema = createInsertSchema(rfqQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: quoteStatusEnum.optional(),
  totalPrice: z.string(), // Decimal comes as string
});

// Types for RFQ entities
export type Rfq = typeof rfqs.$inferSelect;
export type InsertRfq = z.infer<typeof insertRfqSchema>;

export type RfqServiceModule = typeof rfqServiceModules.$inferSelect;
export type InsertRfqServiceModule = z.infer<typeof insertRfqServiceModuleSchema>;

export type RfqSupplier = typeof rfqSuppliers.$inferSelect;
export type InsertRfqSupplier = z.infer<typeof insertRfqSupplierSchema>;

export type RfqQuote = typeof rfqQuotes.$inferSelect;
export type InsertRfqQuote = z.infer<typeof insertRfqQuoteSchema>;

// Contact person type for suppliers (legacy interface)
export interface SupplierContactPerson {
  name: string;
  phone: string;
  email: string;
  role: string;
}

// Document type for various entities
export interface Document {
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// ========== MODULE D: CUSTOMER PROPOSAL & CONTRACTING ==========

// Proposal Status enum
export const proposalStatusEnum = z.enum(['draft', 'sent', 'under_review', 'accepted', 'rejected', 'expired']);
export type ProposalStatus = z.infer<typeof proposalStatusEnum>;

// Proposals - Customer proposals with pricing
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalNumber: text("proposal_number").notNull().unique(), // Human-readable ID like PROP-001
  
  // Customer and sales context
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id),
  
  // Proposal details
  title: text("title").notNull(),
  description: text("description"),
  
  // Status tracking
  status: text("status").notNull().default("draft"),
  
  // Pricing summary
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("DKK"),
  
  // Contract terms
  contractDurationMonths: integer("contract_duration_months").default(12),
  paymentTermsDays: integer("payment_terms_days").default(30),
  
  // Validity
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  respondedAt: timestamp("responded_at"),
  
  // Customer response
  customerNotes: text("customer_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Documents
  documents: jsonb("documents").default([]),
  
  // Ownership
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Proposal Line Items - Individual service/product lines in a proposal
export const proposalLineItems = pgTable("proposal_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: varchar("proposal_id").references(() => proposals.id).notNull(),
  
  // Service reference
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id),
  categoryId: varchar("category_id").references(() => serviceCategories.id),
  templateId: varchar("template_id").references(() => serviceTemplates.id),
  
  // Line item details
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unit: text("unit").default("stk"), // stk, månedlig, årlig, etc.
  
  // Pricing
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  
  // SLA reference
  slaLevel: text("sla_level"), // basic, standard, premium
  slaDetails: text("sla_details"),
  
  // Ordering
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Contracts - Signed contracts generated from proposals
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractNumber: text("contract_number").notNull().unique(), // Human-readable ID like CON-001
  
  // References
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  proposalId: varchar("proposal_id").references(() => proposals.id),
  contractTypeId: varchar("contract_type_id").references(() => contractTypes.id),
  
  // Contract details
  title: text("title").notNull(),
  description: text("description"),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, pending_signature, active, expired, terminated
  
  // Financial terms
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  currency: text("currency").default("DKK"),
  paymentTermsDays: integer("payment_terms_days").default(30),
  
  // Contract period
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(false),
  renewalNoticeDays: integer("renewal_notice_days").default(90),
  
  // SLA Definitions
  slaDefinitions: jsonb("sla_definitions").default([]), // Array of SLA definition objects
  
  // Signature tracking
  signedByCustomer: boolean("signed_by_customer").default(false),
  customerSignatureDate: timestamp("customer_signature_date"),
  customerSignatureName: text("customer_signature_name"),
  signedByCompany: boolean("signed_by_company").default(false),
  companySignatureDate: timestamp("company_signature_date"),
  companySignatureName: text("company_signature_name"),
  
  // Documents
  documents: jsonb("documents").default([]),
  
  // Ownership
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// ========== MODULE E: TRANSITION MANAGEMENT ==========

// Transition Status enum
export const transitionStatusEnum = z.enum(['not_started', 'in_progress', 'completed', 'blocked']);
export type TransitionStatus = z.infer<typeof transitionStatusEnum>;

// Transitions - Main transition record for handover
export const transitions = pgTable("transitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitionNumber: text("transition_number").notNull().unique(), // Human-readable ID like TRN-001
  
  // References
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  contractId: varchar("contract_id").references(() => contracts.id),
  salesCaseId: varchar("sales_case_id").references(() => salesCases.id),
  
  // Transition details
  title: text("title").notNull(),
  description: text("description"),
  
  // Status
  status: text("status").notNull().default("not_started"),
  progressPercent: integer("progress_percent").default(0),
  
  // Timeline
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  
  // Ownership
  leadUserId: varchar("lead_user_id").references(() => users.id),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Transition Tasks - Checklist items for transition
export const transitionTasks = pgTable("transition_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transitionId: varchar("transition_id").references(() => transitions.id).notNull(),
  
  // Task details
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // services, suppliers, sla, documentation, technical
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, blocked, skipped
  
  // Assignment
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  
  // Timeline
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedByUserId: varchar("completed_by_user_id").references(() => users.id),
  
  // Ordering and dependencies
  sortOrder: integer("sort_order").default(0),
  dependsOnTaskId: varchar("depends_on_task_id"),
  
  // Notes
  notes: text("notes"),
  blockedReason: text("blocked_reason"),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// ========== MODULE F: SERVICE DELIVERY & OPERATIONS ==========

// Work Order Status enum
export const workOrderStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold']);
export type WorkOrderStatus = z.infer<typeof workOrderStatusEnum>;

// Work Order Priority enum
export const workOrderPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type WorkOrderPriority = z.infer<typeof workOrderPriorityEnum>;

// Work Orders - Scheduled maintenance and service tasks
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderNumber: text("work_order_number").notNull().unique(), // Human-readable ID like WO-001
  
  // References
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  
  // Work order details
  title: text("title").notNull(),
  description: text("description"),
  workType: text("work_type").notNull().default("maintenance"), // maintenance, repair, inspection, emergency
  
  // Priority and status
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("scheduled"),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date"),
  scheduledEndDate: timestamp("scheduled_end_date"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  
  // Execution
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  
  // Assignment
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  
  // Completion details
  completionNotes: text("completion_notes"),
  partsUsed: jsonb("parts_used").default([]),
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }),
  partsCost: decimal("parts_cost", { precision: 12, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  
  // Documents
  documents: jsonb("documents").default([]),
  photos: jsonb("photos").default([]),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Service Logs - Individual service entries for modules
export const serviceLogs = pgTable("service_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id).notNull(),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  
  // Log details
  logType: text("log_type").notNull().default("service"), // service, inspection, repair, note
  description: text("description").notNull(),
  
  // Technician
  technicianUserId: varchar("technician_user_id").references(() => users.id),
  technicianName: text("technician_name"), // For external technicians
  
  // Service outcome
  outcome: text("outcome"), // passed, failed, needs_attention, completed
  readingsValues: jsonb("readings_values").default({}), // Dynamic readings/measurements
  
  // Photos and documents
  photos: jsonb("photos").default([]),
  documents: jsonb("documents").default([]),
  
  serviceDate: timestamp("service_date").default(sql`now()`).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Incidents - Issues and escalations
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentNumber: text("incident_number").notNull().unique(), // Human-readable ID like INC-001
  
  // References
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  serviceModuleId: varchar("service_module_id").references(() => serviceModules.id),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  
  // Incident details
  title: text("title").notNull(),
  description: text("description"),
  incidentType: text("incident_type").notNull().default("issue"), // issue, complaint, emergency, sla_breach
  
  // Priority and severity
  priority: text("priority").notNull().default("medium"),
  severity: text("severity").notNull().default("low"), // low, medium, high, critical
  
  // Status
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed, escalated
  
  // SLA tracking
  slaBreached: boolean("sla_breached").default(false),
  responseDeadline: timestamp("response_deadline"),
  resolutionDeadline: timestamp("resolution_deadline"),
  
  // Resolution
  resolvedAt: timestamp("resolved_at"),
  resolvedByUserId: varchar("resolved_by_user_id").references(() => users.id),
  resolution: text("resolution"),
  rootCause: text("root_cause"),
  preventiveAction: text("preventive_action"),
  
  // Assignment
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  
  // Escalation
  escalatedAt: timestamp("escalated_at"),
  escalatedToUserId: varchar("escalated_to_user_id").references(() => users.id),
  escalationReason: text("escalation_reason"),
  
  // Reporter
  reportedByName: text("reported_by_name"),
  reportedByEmail: text("reported_by_email"),
  reportedByPhone: text("reported_by_phone"),
  
  // Documents
  documents: jsonb("documents").default([]),
  photos: jsonb("photos").default([]),
  
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Insert schemas for MODULE D
export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  proposalNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: proposalStatusEnum.optional(),
  subtotal: z.string().optional(),
  discountPercent: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string().optional(),
});

export const insertProposalLineItemSchema = createInsertSchema(proposalLineItems).omit({
  id: true,
  createdAt: true,
}).extend({
  unitPrice: z.string(),
  totalPrice: z.string(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  contractNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  totalValue: z.string().optional(),
});

// Insert schemas for MODULE E
export const insertTransitionSchema = createInsertSchema(transitions).omit({
  id: true,
  transitionNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: transitionStatusEnum.optional(),
});

export const insertTransitionTaskSchema = createInsertSchema(transitionTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for MODULE F
export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  workOrderNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: workOrderStatusEnum.optional(),
  priority: workOrderPriorityEnum.optional(),
  laborCost: z.string().optional(),
  partsCost: z.string().optional(),
  totalCost: z.string().optional(),
});

export const insertServiceLogSchema = createInsertSchema(serviceLogs).omit({
  id: true,
  createdAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  incidentNumber: true,
  createdAt: true,
  updatedAt: true,
});

// Types for MODULE D
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type ProposalLineItem = typeof proposalLineItems.$inferSelect;
export type InsertProposalLineItem = z.infer<typeof insertProposalLineItemSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

// Types for MODULE E
export type Transition = typeof transitions.$inferSelect;
export type InsertTransition = z.infer<typeof insertTransitionSchema>;

export type TransitionTask = typeof transitionTasks.$inferSelect;
export type InsertTransitionTask = z.infer<typeof insertTransitionTaskSchema>;

// Types for MODULE F
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type ServiceLog = typeof serviceLogs.$inferSelect;
export type InsertServiceLog = z.infer<typeof insertServiceLogSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
