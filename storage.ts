import { 
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Location, type InsertLocation,
  type ContactPerson, type InsertContactPerson,
  type ServiceCategory, type InsertServiceCategory,
  type ServiceTemplate, type InsertServiceTemplate,
  type Supplier, type InsertSupplier,
  type ServiceModule, type InsertServiceModule,
  type ActivityLog, type InsertActivityLog,
  type ContractType, type InsertContractType,
  type SalesCase, type InsertSalesCase,
  type SalesActivity, type InsertSalesActivity,
  type SalesNote, type InsertSalesNote,
  type SalesCaseModule, type InsertSalesCaseModule,
  type Rfq, type InsertRfq,
  type RfqServiceModule, type InsertRfqServiceModule,
  type RfqSupplier, type InsertRfqSupplier,
  type RfqQuote, type InsertRfqQuote,
  type Proposal, type InsertProposal,
  type ProposalLineItem, type InsertProposalLineItem,
  type Contract, type InsertContract,
  type Transition, type InsertTransition,
  type TransitionTask, type InsertTransitionTask,
  type WorkOrder, type InsertWorkOrder,
  type ServiceLog, type InsertServiceLog,
  type Incident, type InsertIncident,
  users, customers, locations, contactPersons, serviceCategories, serviceTemplates, suppliers, serviceModules, activityLog, contractTypes,
  salesCases, salesActivities, salesNotes, salesCaseModules,
  rfqs, rfqServiceModules, rfqSuppliers, rfqQuotes,
  proposals, proposalLineItems, contracts, transitions, transitionTasks, workOrders, serviceLogs, incidents
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, or, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  getLocationsByCustomer(customerId: string): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  createLocationsBulk(locations: InsertLocation[]): Promise<Location[]>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: string): Promise<void>;

  getContactPersonsByLocation(locationId: string): Promise<ContactPerson[]>;
  getContactPerson(id: string): Promise<ContactPerson | undefined>;
  createContactPerson(contactPerson: InsertContactPerson): Promise<ContactPerson>;
  updateContactPerson(id: string, contactPerson: Partial<InsertContactPerson>): Promise<ContactPerson>;
  deleteContactPerson(id: string): Promise<void>;

  getServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: string): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: string, category: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  deleteServiceCategory(id: string): Promise<void>;

  getServiceTemplates(): Promise<ServiceTemplate[]>;
  getServiceTemplate(id: string): Promise<ServiceTemplate | undefined>;
  getServiceTemplatesByCategory(categoryId: string): Promise<ServiceTemplate[]>;
  createServiceTemplate(template: InsertServiceTemplate): Promise<ServiceTemplate>;
  updateServiceTemplate(id: string, template: Partial<InsertServiceTemplate>): Promise<ServiceTemplate>;
  deleteServiceTemplate(id: string): Promise<void>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSuppliersByCategory(categoryId: string): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  getServiceModules(filters?: {
    customerId?: string;
    locationId?: string;
    categoryId?: string;
    responsibleUserId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ modules: ServiceModule[], total: number }>;
  getServiceModule(id: string): Promise<ServiceModule | undefined>;
  createServiceModule(module: InsertServiceModule): Promise<ServiceModule>;
  createServiceModulesBulk(modules: InsertServiceModule[]): Promise<ServiceModule[]>;
  updateServiceModule(id: string, module: Partial<InsertServiceModule>): Promise<ServiceModule>;
  deleteServiceModule(id: string): Promise<void>;
  getNextModuleId(): Promise<string>;

  getDashboardStats(): Promise<{
    overdueCount: number;
    dueSoonCount: number;
    missingSuppliersCount: number;
    activeModulesCount: number;
  }>;

  createActivityLog(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(limit?: number): Promise<ActivityLog[]>;

  getContractTypes(): Promise<ContractType[]>;
  getContractType(id: string): Promise<ContractType | undefined>;
  createContractType(contractType: InsertContractType): Promise<ContractType>;
  updateContractType(id: string, contractType: Partial<InsertContractType>): Promise<ContractType>;
  deleteContractType(id: string): Promise<void>;

  // Sales Cases
  getSalesCases(filters?: {
    status?: string;
    customerId?: string;
    ownerUserId?: string;
  }): Promise<SalesCase[]>;
  getSalesCase(id: string): Promise<SalesCase | undefined>;
  createSalesCase(salesCase: InsertSalesCase): Promise<SalesCase>;
  updateSalesCase(id: string, salesCase: Partial<InsertSalesCase>): Promise<SalesCase>;
  deleteSalesCase(id: string): Promise<void>;
  getNextCaseNumber(): Promise<string>;

  // Sales Activities
  getSalesActivities(salesCaseId: string): Promise<SalesActivity[]>;
  getSalesActivity(id: string): Promise<SalesActivity | undefined>;
  createSalesActivity(activity: InsertSalesActivity): Promise<SalesActivity>;
  updateSalesActivity(id: string, activity: Partial<InsertSalesActivity>): Promise<SalesActivity>;
  deleteSalesActivity(id: string): Promise<void>;

  // Sales Notes
  getSalesNotes(salesCaseId: string): Promise<SalesNote[]>;
  getSalesNote(id: string): Promise<SalesNote | undefined>;
  createSalesNote(note: InsertSalesNote): Promise<SalesNote>;
  updateSalesNote(id: string, note: Partial<InsertSalesNote>): Promise<SalesNote>;
  deleteSalesNote(id: string): Promise<void>;

  // Sales Case Modules (Preliminary Scope)
  getSalesCaseModules(salesCaseId: string): Promise<SalesCaseModule[]>;
  createSalesCaseModule(module: InsertSalesCaseModule): Promise<SalesCaseModule>;
  deleteSalesCaseModule(id: string): Promise<void>;

  // Pipeline Stats
  getSalesPipelineStats(): Promise<{
    leadCount: number;
    discoveryCount: number;
    proposalCount: number;
    negotiationCount: number;
    wonCount: number;
    lostCount: number;
    totalValue: number;
    weightedValue: number;
  }>;

  // RFQ (Request for Quote) - MODULE C: Procurement & Vendor Benchmarking
  getRfqs(filters?: {
    status?: string;
    customerId?: string;
    categoryId?: string;
  }): Promise<Rfq[]>;
  getRfq(id: string): Promise<Rfq | undefined>;
  createRfq(rfq: InsertRfq): Promise<Rfq>;
  updateRfq(id: string, rfq: Partial<InsertRfq>): Promise<Rfq>;
  deleteRfq(id: string): Promise<void>;
  getNextRfqNumber(): Promise<string>;

  // RFQ Service Modules
  getRfqServiceModules(rfqId: string): Promise<RfqServiceModule[]>;
  createRfqServiceModule(module: InsertRfqServiceModule): Promise<RfqServiceModule>;
  deleteRfqServiceModule(id: string): Promise<void>;

  // RFQ Suppliers (Invited suppliers)
  getRfqSuppliers(rfqId: string): Promise<RfqSupplier[]>;
  createRfqSupplier(supplier: InsertRfqSupplier): Promise<RfqSupplier>;
  updateRfqSupplier(id: string, supplier: Partial<InsertRfqSupplier>): Promise<RfqSupplier>;
  deleteRfqSupplier(id: string): Promise<void>;

  // RFQ Quotes (Supplier responses)
  getRfqQuotes(rfqId: string): Promise<RfqQuote[]>;
  getRfqQuote(id: string): Promise<RfqQuote | undefined>;
  createRfqQuote(quote: InsertRfqQuote): Promise<RfqQuote>;
  updateRfqQuote(id: string, quote: Partial<InsertRfqQuote>): Promise<RfqQuote>;
  deleteRfqQuote(id: string): Promise<void>;

  // RFQ Benchmark Engine
  calculateBenchmarkScores(rfqId: string): Promise<RfqQuote[]>;
  awardRfq(rfqId: string, supplierId: string, reason: string): Promise<Rfq>;

  // MODULE D: Proposals
  getProposals(filters?: { customerId?: string; status?: string }): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal>;
  deleteProposal(id: string): Promise<void>;
  getNextProposalNumber(): Promise<string>;

  // Proposal Line Items
  getProposalLineItems(proposalId: string): Promise<ProposalLineItem[]>;
  createProposalLineItem(lineItem: InsertProposalLineItem): Promise<ProposalLineItem>;
  updateProposalLineItem(id: string, lineItem: Partial<InsertProposalLineItem>): Promise<ProposalLineItem>;
  deleteProposalLineItem(id: string): Promise<void>;

  // Contracts
  getContracts(filters?: { customerId?: string; status?: string }): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  getNextContractNumber(): Promise<string>;

  // MODULE E: Transitions
  getTransitions(filters?: { customerId?: string; status?: string }): Promise<Transition[]>;
  getTransition(id: string): Promise<Transition | undefined>;
  createTransition(transition: InsertTransition): Promise<Transition>;
  updateTransition(id: string, transition: Partial<InsertTransition>): Promise<Transition>;
  deleteTransition(id: string): Promise<void>;
  getNextTransitionNumber(): Promise<string>;

  // Transition Tasks
  getTransitionTasks(transitionId: string): Promise<TransitionTask[]>;
  getTransitionTask(id: string): Promise<TransitionTask | undefined>;
  createTransitionTask(task: InsertTransitionTask): Promise<TransitionTask>;
  updateTransitionTask(id: string, task: Partial<InsertTransitionTask>): Promise<TransitionTask>;
  deleteTransitionTask(id: string): Promise<void>;

  // MODULE F: Work Orders
  getWorkOrders(filters?: { customerId?: string; locationId?: string; status?: string; priority?: string }): Promise<WorkOrder[]>;
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder>;
  deleteWorkOrder(id: string): Promise<void>;
  getNextWorkOrderNumber(): Promise<string>;

  // Service Logs
  getServiceLogs(serviceModuleId: string): Promise<ServiceLog[]>;
  getServiceLog(id: string): Promise<ServiceLog | undefined>;
  createServiceLog(log: InsertServiceLog): Promise<ServiceLog>;
  updateServiceLog(id: string, log: Partial<InsertServiceLog>): Promise<ServiceLog>;
  deleteServiceLog(id: string): Promise<void>;

  // Incidents
  getIncidents(filters?: { customerId?: string; status?: string; priority?: string }): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, incident: Partial<InsertIncident>): Promise<Incident>;
  deleteIncident(id: string): Promise<void>;
  getNextIncidentNumber(): Promise<string>;

  initializeDefaults(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'customer',
      entityId: customer.id,
      action: 'created',
      details: { name: customer.name },
    });
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    if (!customer) throw new Error(`Customer with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'customer',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.getCustomer(id);
    if (!customer) throw new Error(`Customer with id ${id} not found`);
    await db.delete(customers).where(eq(customers.id, id));
    await this.createActivityLog({
      userId: null,
      entityType: 'customer',
      entityId: id,
      action: 'deleted',
      details: { name: customer.name },
    });
  }

  async getLocationsByCustomer(customerId: string): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.customerId, customerId)).orderBy(locations.name);
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'location',
      entityId: location.id,
      action: 'created',
      details: { name: location.name, customerId: location.customerId },
    });
    return location;
  }

  async createLocationsBulk(insertLocations: InsertLocation[]): Promise<Location[]> {
    if (insertLocations.length === 0) return [];
    const createdLocations = await db.insert(locations).values(insertLocations).returning();
    for (const location of createdLocations) {
      await this.createActivityLog({
        userId: null,
        entityType: 'location',
        entityId: location.id,
        action: 'created',
        details: { name: location.name, customerId: location.customerId },
      });
    }
    return createdLocations;
  }

  async updateLocation(id: string, updates: Partial<InsertLocation>): Promise<Location> {
    const [location] = await db.update(locations).set(updates).where(eq(locations.id, id)).returning();
    if (!location) throw new Error(`Location with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'location',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    const location = await this.getLocation(id);
    if (!location) throw new Error(`Location with id ${id} not found`);
    await db.delete(locations).where(eq(locations.id, id));
    await this.createActivityLog({
      userId: null,
      entityType: 'location',
      entityId: id,
      action: 'deleted',
      details: { name: location.name },
    });
  }

  async getContactPersonsByLocation(locationId: string): Promise<ContactPerson[]> {
    return await db.select().from(contactPersons).where(eq(contactPersons.locationId, locationId)).orderBy(contactPersons.name);
  }

  async getContactPerson(id: string): Promise<ContactPerson | undefined> {
    const [contactPerson] = await db.select().from(contactPersons).where(eq(contactPersons.id, id));
    return contactPerson || undefined;
  }

  async createContactPerson(insertContactPerson: InsertContactPerson): Promise<ContactPerson> {
    const [contactPerson] = await db.insert(contactPersons).values(insertContactPerson).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'contact_person',
      entityId: contactPerson.id,
      action: 'created',
      details: { name: contactPerson.name, locationId: contactPerson.locationId },
    });
    return contactPerson;
  }

  async updateContactPerson(id: string, updates: Partial<InsertContactPerson>): Promise<ContactPerson> {
    const [contactPerson] = await db.update(contactPersons).set(updates).where(eq(contactPersons.id, id)).returning();
    if (!contactPerson) throw new Error(`Contact person with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'contact_person',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return contactPerson;
  }

  async deleteContactPerson(id: string): Promise<void> {
    const contactPerson = await this.getContactPerson(id);
    if (!contactPerson) throw new Error(`Contact person with id ${id} not found`);
    await db.delete(contactPersons).where(eq(contactPersons.id, id));
    await this.createActivityLog({
      userId: null,
      entityType: 'contact_person',
      entityId: id,
      action: 'deleted',
      details: { name: contactPerson.name },
    });
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories).orderBy(serviceCategories.name);
  }

  async getServiceCategory(id: string): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category || undefined;
  }

  async createServiceCategory(insertCategory: InsertServiceCategory): Promise<ServiceCategory> {
    const [category] = await db.insert(serviceCategories).values(insertCategory).returning();
    return category;
  }

  async updateServiceCategory(id: string, updates: Partial<InsertServiceCategory>): Promise<ServiceCategory> {
    const [category] = await db.update(serviceCategories).set(updates).where(eq(serviceCategories.id, id)).returning();
    if (!category) throw new Error(`Service category with id ${id} not found`);
    return category;
  }

  async deleteServiceCategory(id: string): Promise<void> {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  }

  async getServiceTemplates(): Promise<ServiceTemplate[]> {
    return await db.select().from(serviceTemplates).orderBy(serviceTemplates.templateName);
  }

  async getServiceTemplate(id: string): Promise<ServiceTemplate | undefined> {
    const [template] = await db.select().from(serviceTemplates).where(eq(serviceTemplates.id, id));
    return template || undefined;
  }

  async getServiceTemplatesByCategory(categoryId: string): Promise<ServiceTemplate[]> {
    return await db.select().from(serviceTemplates).where(eq(serviceTemplates.categoryId, categoryId)).orderBy(serviceTemplates.templateName);
  }

  async createServiceTemplate(insertTemplate: InsertServiceTemplate): Promise<ServiceTemplate> {
    const [template] = await db.insert(serviceTemplates).values(insertTemplate).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'service_template',
      entityId: template.id,
      action: 'created',
      details: { templateName: template.templateName },
    });
    return template;
  }

  async updateServiceTemplate(id: string, updates: Partial<InsertServiceTemplate>): Promise<ServiceTemplate> {
    const [template] = await db.update(serviceTemplates).set(updates).where(eq(serviceTemplates.id, id)).returning();
    if (!template) throw new Error(`Service template with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'service_template',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return template;
  }

  async deleteServiceTemplate(id: string): Promise<void> {
    const template = await this.getServiceTemplate(id);
    if (!template) throw new Error(`Service template with id ${id} not found`);
    await db.delete(serviceTemplates).where(eq(serviceTemplates.id, id));
    await this.createActivityLog({
      userId: null,
      entityType: 'service_template',
      entityId: id,
      action: 'deleted',
      details: { templateName: template.templateName },
    });
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(suppliers.name);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSuppliersByCategory(categoryId: string): Promise<Supplier[]> {
    const allSuppliers = await db.select().from(suppliers).where(eq(suppliers.isActive, true));
    return allSuppliers.filter(supplier => 
      Array.isArray(supplier.categories) && supplier.categories.includes(categoryId)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values({
      ...insertSupplier,
      categories: insertSupplier.categories || [],
      contactPersons: insertSupplier.contactPersons || [],
      documents: insertSupplier.documents || [],
      qualityRating: insertSupplier.qualityRating || "0",
      priceRating: insertSupplier.priceRating || "0",
    }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'supplier',
      entityId: supplier.id,
      action: 'created',
      details: { name: supplier.name },
    });
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
    if (!supplier) throw new Error(`Supplier with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'supplier',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await this.getSupplier(id);
    if (!supplier) throw new Error(`Supplier with id ${id} not found`);
    await db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id));
    await this.createActivityLog({
      userId: null,
      entityType: 'supplier',
      entityId: id,
      action: 'deactivated',
      details: { name: supplier.name },
    });
  }

  async getServiceModules(filters: {
    customerId?: string;
    locationId?: string;
    categoryId?: string;
    responsibleUserId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ modules: ServiceModule[], total: number }> {
    const conditions = [];
    if (filters.customerId) conditions.push(eq(serviceModules.customerId, filters.customerId));
    if (filters.locationId) conditions.push(eq(serviceModules.locationId, filters.locationId));
    if (filters.categoryId) conditions.push(eq(serviceModules.categoryId, filters.categoryId));
    if (filters.responsibleUserId) conditions.push(eq(serviceModules.responsibleUserId, filters.responsibleUserId));
    if (filters.status) conditions.push(eq(serviceModules.status, filters.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db.select({ count: count() }).from(serviceModules).where(whereClause);
    const total = totalResult?.count || 0;

    let query = db.select().from(serviceModules).where(whereClause).orderBy(desc(serviceModules.createdAt));
    
    if (filters.offset) query = query.offset(filters.offset) as typeof query;
    if (filters.limit) query = query.limit(filters.limit) as typeof query;

    const modules = await query;
    return { modules, total };
  }

  async getServiceModule(id: string): Promise<ServiceModule | undefined> {
    const [module] = await db.select().from(serviceModules).where(eq(serviceModules.id, id));
    return module || undefined;
  }

  async createServiceModule(insertModule: InsertServiceModule): Promise<ServiceModule> {
    const moduleId = await this.getNextModuleId();
    const [module] = await db.insert(serviceModules).values({
      ...insertModule,
      moduleId,
      status: insertModule.status || "active",
      fieldValues: insertModule.fieldValues || {},
      documents: insertModule.documents || [],
    }).returning();
    await this.createActivityLog({
      userId: insertModule.responsibleUserId,
      entityType: 'service_module',
      entityId: module.id,
      action: 'created',
      details: { moduleId },
    });
    return module;
  }

  async createServiceModulesBulk(insertModules: InsertServiceModule[]): Promise<ServiceModule[]> {
    const createdModules: ServiceModule[] = [];
    for (const insertModule of insertModules) {
      const module = await this.createServiceModule(insertModule);
      createdModules.push(module);
    }
    return createdModules;
  }

  async updateServiceModule(id: string, updates: Partial<InsertServiceModule>): Promise<ServiceModule> {
    const [module] = await db.update(serviceModules).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(serviceModules.id, id)).returning();
    if (!module) throw new Error(`Service module with id ${id} not found`);
    await this.createActivityLog({
      userId: updates.responsibleUserId || module.responsibleUserId,
      entityType: 'service_module',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return module;
  }

  async deleteServiceModule(id: string): Promise<void> {
    const module = await this.getServiceModule(id);
    if (!module) throw new Error(`Service module with id ${id} not found`);
    await db.delete(serviceModules).where(eq(serviceModules.id, id));
    await this.createActivityLog({
      userId: module.responsibleUserId,
      entityType: 'service_module',
      entityId: id,
      action: 'deleted',
      details: { moduleId: module.moduleId },
    });
  }

  async getNextModuleId(): Promise<string> {
    const result = await db.select({ moduleId: serviceModules.moduleId }).from(serviceModules);
    const highestNumber = result
      .map(m => {
        const match = m.moduleId.match(/MOD-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    return `MOD-${String(highestNumber + 1).padStart(3, '0')}`;
  }

  async getDashboardStats(): Promise<{
    overdueCount: number;
    dueSoonCount: number;
    missingSuppliersCount: number;
    activeModulesCount: number;
  }> {
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000));

    const allModules = await db.select().from(serviceModules);

    const overdueCount = allModules.filter(m => 
      m.nextServiceDate && new Date(m.nextServiceDate) < now
    ).length;

    const dueSoonCount = allModules.filter(m => 
      m.nextServiceDate && 
      new Date(m.nextServiceDate) >= now &&
      new Date(m.nextServiceDate) <= tenDaysFromNow
    ).length;

    const missingSuppliersCount = allModules.filter(m => !m.supplierId).length;
    const activeModulesCount = allModules.filter(m => m.status === 'active').length;

    return { overdueCount, dueSoonCount, missingSuppliersCount, activeModulesCount };
  }

  async createActivityLog(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLog).values(insertActivity).returning();
    return activity;
  }

  async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
  }

  async getContractTypes(): Promise<ContractType[]> {
    return await db.select().from(contractTypes).orderBy(contractTypes.name);
  }

  async getContractType(id: string): Promise<ContractType | undefined> {
    const [contractType] = await db.select().from(contractTypes).where(eq(contractTypes.id, id));
    return contractType || undefined;
  }

  async createContractType(insertContractType: InsertContractType): Promise<ContractType> {
    const [contractType] = await db.insert(contractTypes).values(insertContractType).returning();
    return contractType;
  }

  async updateContractType(id: string, updates: Partial<InsertContractType>): Promise<ContractType> {
    const [contractType] = await db.update(contractTypes).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(contractTypes.id, id)).returning();
    if (!contractType) throw new Error(`Contract type with id ${id} not found`);
    return contractType;
  }

  async deleteContractType(id: string): Promise<void> {
    await db.delete(contractTypes).where(eq(contractTypes.id, id));
  }

  // Sales Cases
  async getSalesCases(filters: {
    status?: string;
    customerId?: string;
    ownerUserId?: string;
  } = {}): Promise<SalesCase[]> {
    const conditions = [];
    if (filters.status) conditions.push(eq(salesCases.status, filters.status));
    if (filters.customerId) conditions.push(eq(salesCases.customerId, filters.customerId));
    if (filters.ownerUserId) conditions.push(eq(salesCases.ownerUserId, filters.ownerUserId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db.select().from(salesCases).where(whereClause).orderBy(desc(salesCases.updatedAt));
  }

  async getSalesCase(id: string): Promise<SalesCase | undefined> {
    const [salesCase] = await db.select().from(salesCases).where(eq(salesCases.id, id));
    return salesCase || undefined;
  }

  async createSalesCase(insertSalesCase: InsertSalesCase): Promise<SalesCase> {
    const caseNumber = await this.getNextCaseNumber();
    const [salesCase] = await db.insert(salesCases).values({
      ...insertSalesCase,
      caseNumber,
      status: insertSalesCase.status || "lead",
      probability: insertSalesCase.probability || 10,
    }).returning();
    await this.createActivityLog({
      userId: insertSalesCase.ownerUserId || null,
      entityType: 'sales_case',
      entityId: salesCase.id,
      action: 'created',
      details: { title: salesCase.title, caseNumber },
    });
    return salesCase;
  }

  async updateSalesCase(id: string, updates: Partial<InsertSalesCase>): Promise<SalesCase> {
    const existingCase = await this.getSalesCase(id);
    if (!existingCase) throw new Error(`Sales case with id ${id} not found`);
    
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // If status changed to won or lost, set closedAt
    if (updates.status && ['won', 'lost'].includes(updates.status) && !existingCase.closedAt) {
      updateData.closedAt = new Date();
    }

    const [salesCase] = await db.update(salesCases).set(updateData).where(eq(salesCases.id, id)).returning();
    
    // Log status change
    if (updates.status && updates.status !== existingCase.status) {
      await this.createActivityLog({
        userId: updates.ownerUserId || existingCase.ownerUserId || null,
        entityType: 'sales_case',
        entityId: id,
        action: 'status_changed',
        details: { from: existingCase.status, to: updates.status },
      });
    } else {
      await this.createActivityLog({
        userId: updates.ownerUserId || existingCase.ownerUserId || null,
        entityType: 'sales_case',
        entityId: id,
        action: 'updated',
        details: updates,
      });
    }
    
    return salesCase;
  }

  async deleteSalesCase(id: string): Promise<void> {
    const salesCase = await this.getSalesCase(id);
    if (!salesCase) throw new Error(`Sales case with id ${id} not found`);
    
    // Delete related data first
    await db.delete(salesCaseModules).where(eq(salesCaseModules.salesCaseId, id));
    await db.delete(salesNotes).where(eq(salesNotes.salesCaseId, id));
    await db.delete(salesActivities).where(eq(salesActivities.salesCaseId, id));
    await db.delete(salesCases).where(eq(salesCases.id, id));
    
    await this.createActivityLog({
      userId: salesCase.ownerUserId || null,
      entityType: 'sales_case',
      entityId: id,
      action: 'deleted',
      details: { title: salesCase.title, caseNumber: salesCase.caseNumber },
    });
  }

  async getNextCaseNumber(): Promise<string> {
    const result = await db.select({ caseNumber: salesCases.caseNumber }).from(salesCases);
    const highestNumber = result
      .map(c => {
        const match = c.caseNumber.match(/SC-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((max, num) => Math.max(max, num), 0);
    return `SC-${String(highestNumber + 1).padStart(4, '0')}`;
  }

  // Sales Activities
  async getSalesActivities(salesCaseId: string): Promise<SalesActivity[]> {
    return await db.select().from(salesActivities)
      .where(eq(salesActivities.salesCaseId, salesCaseId))
      .orderBy(desc(salesActivities.scheduledAt));
  }

  async getSalesActivity(id: string): Promise<SalesActivity | undefined> {
    const [activity] = await db.select().from(salesActivities).where(eq(salesActivities.id, id));
    return activity || undefined;
  }

  async createSalesActivity(insertActivity: InsertSalesActivity): Promise<SalesActivity> {
    const [activity] = await db.insert(salesActivities).values({
      ...insertActivity,
      outcome: insertActivity.outcome || "planned",
    }).returning();
    await this.createActivityLog({
      userId: insertActivity.ownerUserId || null,
      entityType: 'sales_activity',
      entityId: activity.id,
      action: 'created',
      details: { subject: activity.subject, activityType: activity.activityType },
    });
    return activity;
  }

  async updateSalesActivity(id: string, updates: Partial<InsertSalesActivity>): Promise<SalesActivity> {
    const [activity] = await db.update(salesActivities).set({
      ...updates,
      updatedAt: new Date(),
    }).where(eq(salesActivities.id, id)).returning();
    if (!activity) throw new Error(`Sales activity with id ${id} not found`);
    return activity;
  }

  async deleteSalesActivity(id: string): Promise<void> {
    await db.delete(salesActivities).where(eq(salesActivities.id, id));
  }

  // Sales Notes
  async getSalesNotes(salesCaseId: string): Promise<SalesNote[]> {
    return await db.select().from(salesNotes)
      .where(eq(salesNotes.salesCaseId, salesCaseId))
      .orderBy(desc(salesNotes.createdAt));
  }

  async getSalesNote(id: string): Promise<SalesNote | undefined> {
    const [note] = await db.select().from(salesNotes).where(eq(salesNotes.id, id));
    return note || undefined;
  }

  async createSalesNote(insertNote: InsertSalesNote): Promise<SalesNote> {
    const [note] = await db.insert(salesNotes).values(insertNote).returning();
    return note;
  }

  async updateSalesNote(id: string, updates: Partial<InsertSalesNote>): Promise<SalesNote> {
    const [note] = await db.update(salesNotes).set(updates).where(eq(salesNotes.id, id)).returning();
    if (!note) throw new Error(`Sales note with id ${id} not found`);
    return note;
  }

  async deleteSalesNote(id: string): Promise<void> {
    await db.delete(salesNotes).where(eq(salesNotes.id, id));
  }

  // Sales Case Modules
  async getSalesCaseModules(salesCaseId: string): Promise<SalesCaseModule[]> {
    return await db.select().from(salesCaseModules)
      .where(eq(salesCaseModules.salesCaseId, salesCaseId))
      .orderBy(desc(salesCaseModules.createdAt));
  }

  async createSalesCaseModule(insertModule: InsertSalesCaseModule): Promise<SalesCaseModule> {
    const [module] = await db.insert(salesCaseModules).values(insertModule).returning();
    return module;
  }

  async deleteSalesCaseModule(id: string): Promise<void> {
    await db.delete(salesCaseModules).where(eq(salesCaseModules.id, id));
  }

  // Pipeline Stats
  async getSalesPipelineStats(): Promise<{
    leadCount: number;
    discoveryCount: number;
    proposalCount: number;
    negotiationCount: number;
    wonCount: number;
    lostCount: number;
    totalValue: number;
    weightedValue: number;
  }> {
    const allCases = await db.select().from(salesCases);
    
    const stats = {
      leadCount: 0,
      discoveryCount: 0,
      proposalCount: 0,
      negotiationCount: 0,
      wonCount: 0,
      lostCount: 0,
      totalValue: 0,
      weightedValue: 0,
    };

    for (const c of allCases) {
      const value = parseFloat(c.estimatedValue || "0");
      const probability = c.probability || 0;
      
      switch (c.status) {
        case 'lead': stats.leadCount++; break;
        case 'discovery': stats.discoveryCount++; break;
        case 'proposal': stats.proposalCount++; break;
        case 'negotiation': stats.negotiationCount++; break;
        case 'won': stats.wonCount++; break;
        case 'lost': stats.lostCount++; break;
      }
      
      if (!['won', 'lost'].includes(c.status)) {
        stats.totalValue += value;
        stats.weightedValue += value * (probability / 100);
      }
    }

    return stats;
  }

  // ========== MODULE C: RFQ (Request for Quote) Methods ==========

  async getRfqs(filters: {
    status?: string;
    customerId?: string;
    categoryId?: string;
  } = {}): Promise<Rfq[]> {
    const conditions = [];
    if (filters.status) conditions.push(eq(rfqs.status, filters.status));
    if (filters.customerId) conditions.push(eq(rfqs.customerId, filters.customerId));
    if (filters.categoryId) conditions.push(eq(rfqs.categoryId, filters.categoryId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await db.select().from(rfqs).where(whereClause).orderBy(desc(rfqs.createdAt));
  }

  async getRfq(id: string): Promise<Rfq | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq || undefined;
  }

  async getNextRfqNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(rfqs);
    const nextNum = (result?.count || 0) + 1;
    return `RFQ-${String(nextNum).padStart(4, '0')}`;
  }

  async createRfq(insertRfq: InsertRfq): Promise<Rfq> {
    const rfqNumber = await this.getNextRfqNumber();
    const [rfq] = await db.insert(rfqs).values({
      ...insertRfq,
      rfqNumber,
      status: insertRfq.status || 'draft',
    }).returning();
    
    await this.createActivityLog({
      userId: insertRfq.createdByUserId,
      entityType: 'rfq',
      entityId: rfq.id,
      action: 'created',
      details: { rfqNumber, title: insertRfq.title },
    });
    
    return rfq;
  }

  async updateRfq(id: string, updates: Partial<InsertRfq>): Promise<Rfq> {
    const [rfq] = await db.update(rfqs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rfqs.id, id))
      .returning();
    if (!rfq) throw new Error(`RFQ with id ${id} not found`);
    
    await this.createActivityLog({
      userId: null,
      entityType: 'rfq',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    
    return rfq;
  }

  async deleteRfq(id: string): Promise<void> {
    const rfq = await this.getRfq(id);
    if (!rfq) throw new Error(`RFQ with id ${id} not found`);
    
    // Delete related records first
    await db.delete(rfqQuotes).where(eq(rfqQuotes.rfqId, id));
    await db.delete(rfqSuppliers).where(eq(rfqSuppliers.rfqId, id));
    await db.delete(rfqServiceModules).where(eq(rfqServiceModules.rfqId, id));
    await db.delete(rfqs).where(eq(rfqs.id, id));
    
    await this.createActivityLog({
      userId: null,
      entityType: 'rfq',
      entityId: id,
      action: 'deleted',
      details: { rfqNumber: rfq.rfqNumber },
    });
  }

  // RFQ Service Modules
  async getRfqServiceModules(rfqId: string): Promise<RfqServiceModule[]> {
    return await db.select().from(rfqServiceModules)
      .where(eq(rfqServiceModules.rfqId, rfqId))
      .orderBy(rfqServiceModules.createdAt);
  }

  async createRfqServiceModule(insertModule: InsertRfqServiceModule): Promise<RfqServiceModule> {
    const [module] = await db.insert(rfqServiceModules).values(insertModule).returning();
    return module;
  }

  async deleteRfqServiceModule(id: string): Promise<void> {
    await db.delete(rfqServiceModules).where(eq(rfqServiceModules.id, id));
  }

  // RFQ Suppliers
  async getRfqSuppliers(rfqId: string): Promise<RfqSupplier[]> {
    return await db.select().from(rfqSuppliers)
      .where(eq(rfqSuppliers.rfqId, rfqId))
      .orderBy(rfqSuppliers.createdAt);
  }

  async createRfqSupplier(insertSupplier: InsertRfqSupplier): Promise<RfqSupplier> {
    const [supplier] = await db.insert(rfqSuppliers).values({
      ...insertSupplier,
      invitedAt: new Date(),
    }).returning();
    return supplier;
  }

  async updateRfqSupplier(id: string, updates: Partial<InsertRfqSupplier>): Promise<RfqSupplier> {
    const [supplier] = await db.update(rfqSuppliers).set(updates).where(eq(rfqSuppliers.id, id)).returning();
    if (!supplier) throw new Error(`RFQ Supplier with id ${id} not found`);
    return supplier;
  }

  async deleteRfqSupplier(id: string): Promise<void> {
    await db.delete(rfqSuppliers).where(eq(rfqSuppliers.id, id));
  }

  // RFQ Quotes
  async getRfqQuotes(rfqId: string): Promise<RfqQuote[]> {
    return await db.select().from(rfqQuotes)
      .where(eq(rfqQuotes.rfqId, rfqId))
      .orderBy(rfqQuotes.overallRank, rfqQuotes.createdAt);
  }

  async getRfqQuote(id: string): Promise<RfqQuote | undefined> {
    const [quote] = await db.select().from(rfqQuotes).where(eq(rfqQuotes.id, id));
    return quote || undefined;
  }

  async createRfqQuote(insertQuote: InsertRfqQuote): Promise<RfqQuote> {
    const [quote] = await db.insert(rfqQuotes).values({
      ...insertQuote,
      submittedAt: new Date(),
      status: 'submitted',
    }).returning();
    
    // Update the RFQ supplier status
    const rfqSupplier = await db.select().from(rfqSuppliers)
      .where(and(
        eq(rfqSuppliers.rfqId, insertQuote.rfqId),
        eq(rfqSuppliers.supplierId, insertQuote.supplierId)
      ));
    
    if (rfqSupplier.length > 0) {
      await db.update(rfqSuppliers)
        .set({ status: 'quoted', respondedAt: new Date() })
        .where(eq(rfqSuppliers.id, rfqSupplier[0].id));
    }
    
    return quote;
  }

  async updateRfqQuote(id: string, updates: Partial<InsertRfqQuote>): Promise<RfqQuote> {
    const [quote] = await db.update(rfqQuotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rfqQuotes.id, id))
      .returning();
    if (!quote) throw new Error(`RFQ Quote with id ${id} not found`);
    return quote;
  }

  async deleteRfqQuote(id: string): Promise<void> {
    await db.delete(rfqQuotes).where(eq(rfqQuotes.id, id));
  }

  // Benchmark Engine - Calculate weighted scores for all quotes in an RFQ
  async calculateBenchmarkScores(rfqId: string): Promise<RfqQuote[]> {
    const rfq = await this.getRfq(rfqId);
    if (!rfq) throw new Error(`RFQ with id ${rfqId} not found`);

    const quotes = await this.getRfqQuotes(rfqId);
    if (quotes.length === 0) return [];

    // Get weights from RFQ (default to equal weights if not set)
    const priceWeight = rfq.priceWeight || 40;
    const qualityWeight = rfq.qualityWeight || 30;
    const deliveryWeight = rfq.deliveryWeight || 15;
    const complianceWeight = rfq.complianceWeight || 15;
    const totalWeight = priceWeight + qualityWeight + deliveryWeight + complianceWeight;

    // Find min/max prices for normalization
    const prices = quotes.map(q => parseFloat(q.totalPrice || "0"));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Calculate benchmark scores
    const scoredQuotes = quotes.map(quote => {
      const price = parseFloat(quote.totalPrice || "0");
      
      // Price score: lower is better (inverted normalization)
      const priceScore = maxPrice === minPrice ? 100 : ((maxPrice - price) / priceRange) * 100;
      
      // Quality, compliance, ESG scores are already 0-100
      const qualityScore = parseFloat(quote.qualityScore || "50");
      const complianceScore = parseFloat(quote.complianceScore || "50");
      const esgScore = parseFloat(quote.esgScore || "50");
      
      // Delivery score: lower days is better, normalize to 0-100
      const deliveryDays = quote.deliveryDays || 30;
      const deliveryScore = Math.max(0, 100 - (deliveryDays * 2)); // 0 days = 100, 50+ days = 0

      // Calculate weighted benchmark score
      const benchmarkScore = (
        (priceScore * priceWeight) +
        (qualityScore * qualityWeight) +
        (deliveryScore * deliveryWeight) +
        (((complianceScore + esgScore) / 2) * complianceWeight)
      ) / totalWeight;

      return { ...quote, benchmarkScore, price };
    });

    // Sort by benchmark score descending and assign ranks
    scoredQuotes.sort((a, b) => b.benchmarkScore - a.benchmarkScore);
    
    // Also sort by price for price rank
    const priceRanked = [...scoredQuotes].sort((a, b) => a.price - b.price);

    // Update quotes with scores and ranks
    const updatedQuotes: RfqQuote[] = [];
    for (let i = 0; i < scoredQuotes.length; i++) {
      const quote = scoredQuotes[i];
      const priceRank = priceRanked.findIndex(q => q.id === quote.id) + 1;
      
      const [updated] = await db.update(rfqQuotes)
        .set({
          benchmarkScore: String(quote.benchmarkScore.toFixed(2)),
          priceRank,
          overallRank: i + 1,
          evaluatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(rfqQuotes.id, quote.id))
        .returning();
      
      updatedQuotes.push(updated);
    }

    // Update RFQ status to evaluating
    await this.updateRfq(rfqId, { status: 'evaluating' } as Partial<InsertRfq>);

    return updatedQuotes;
  }

  // Award RFQ to a supplier
  async awardRfq(rfqId: string, supplierId: string, reason: string): Promise<Rfq> {
    const rfq = await this.getRfq(rfqId);
    if (!rfq) throw new Error(`RFQ with id ${rfqId} not found`);

    // Update the selected quote to accepted
    await db.update(rfqQuotes)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(and(eq(rfqQuotes.rfqId, rfqId), eq(rfqQuotes.supplierId, supplierId)));

    // Update other quotes to rejected
    await db.update(rfqQuotes)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(and(
        eq(rfqQuotes.rfqId, rfqId),
        sql`${rfqQuotes.supplierId} != ${supplierId}`
      ));

    // Update RFQ with awarded supplier
    const [updated] = await db.update(rfqs)
      .set({
        status: 'awarded',
        awardedSupplierId: supplierId,
        awardReason: reason,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rfqs.id, rfqId))
      .returning();

    await this.createActivityLog({
      userId: null,
      entityType: 'rfq',
      entityId: rfqId,
      action: 'awarded',
      details: { supplierId, reason, rfqNumber: rfq.rfqNumber },
    });

    return updated;
  }

  // ========== MODULE D: PROPOSALS ==========
  async getProposals(filters?: { customerId?: string; status?: string }): Promise<Proposal[]> {
    let query = db.select().from(proposals);
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(proposals.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(proposals.status, filters.status));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(proposals.createdAt));
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal || undefined;
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const proposalNumber = await this.getNextProposalNumber();
    const [proposal] = await db.insert(proposals).values({ ...insertProposal, proposalNumber }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'proposal',
      entityId: proposal.id,
      action: 'created',
      details: { proposalNumber, title: proposal.title },
    });
    return proposal;
  }

  async updateProposal(id: string, updates: Partial<InsertProposal>): Promise<Proposal> {
    const [proposal] = await db.update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    if (!proposal) throw new Error(`Proposal with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'proposal',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return proposal;
  }

  async deleteProposal(id: string): Promise<void> {
    await db.delete(proposalLineItems).where(eq(proposalLineItems.proposalId, id));
    await db.delete(proposals).where(eq(proposals.id, id));
  }

  async getNextProposalNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(proposals);
    const num = (result?.count || 0) + 1;
    return `PROP-${String(num).padStart(4, '0')}`;
  }

  async getProposalLineItems(proposalId: string): Promise<ProposalLineItem[]> {
    return await db.select().from(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, proposalId))
      .orderBy(proposalLineItems.sortOrder);
  }

  async createProposalLineItem(insertLineItem: InsertProposalLineItem): Promise<ProposalLineItem> {
    const [lineItem] = await db.insert(proposalLineItems).values(insertLineItem).returning();
    return lineItem;
  }

  async updateProposalLineItem(id: string, updates: Partial<InsertProposalLineItem>): Promise<ProposalLineItem> {
    const [lineItem] = await db.update(proposalLineItems).set(updates).where(eq(proposalLineItems.id, id)).returning();
    if (!lineItem) throw new Error(`Proposal line item with id ${id} not found`);
    return lineItem;
  }

  async deleteProposalLineItem(id: string): Promise<void> {
    await db.delete(proposalLineItems).where(eq(proposalLineItems.id, id));
  }

  // Contracts
  async getContracts(filters?: { customerId?: string; status?: string }): Promise<Contract[]> {
    let query = db.select().from(contracts);
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(contracts.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(contracts.status, filters.status));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const contractNumber = await this.getNextContractNumber();
    const [contract] = await db.insert(contracts).values({ ...insertContract, contractNumber }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'contract',
      entityId: contract.id,
      action: 'created',
      details: { contractNumber, title: contract.title },
    });
    return contract;
  }

  async updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract> {
    const [contract] = await db.update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    if (!contract) throw new Error(`Contract with id ${id} not found`);
    await this.createActivityLog({
      userId: null,
      entityType: 'contract',
      entityId: id,
      action: 'updated',
      details: updates,
    });
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  async getNextContractNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(contracts);
    const num = (result?.count || 0) + 1;
    return `CON-${String(num).padStart(4, '0')}`;
  }

  // ========== MODULE E: TRANSITIONS ==========
  async getTransitions(filters?: { customerId?: string; status?: string }): Promise<Transition[]> {
    let query = db.select().from(transitions);
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(transitions.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(transitions.status, filters.status));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(transitions.createdAt));
  }

  async getTransition(id: string): Promise<Transition | undefined> {
    const [transition] = await db.select().from(transitions).where(eq(transitions.id, id));
    return transition || undefined;
  }

  async createTransition(insertTransition: InsertTransition): Promise<Transition> {
    const transitionNumber = await this.getNextTransitionNumber();
    const [transition] = await db.insert(transitions).values({ ...insertTransition, transitionNumber }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'transition',
      entityId: transition.id,
      action: 'created',
      details: { transitionNumber, title: transition.title },
    });
    return transition;
  }

  async updateTransition(id: string, updates: Partial<InsertTransition>): Promise<Transition> {
    const [transition] = await db.update(transitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transitions.id, id))
      .returning();
    if (!transition) throw new Error(`Transition with id ${id} not found`);
    return transition;
  }

  async deleteTransition(id: string): Promise<void> {
    await db.delete(transitionTasks).where(eq(transitionTasks.transitionId, id));
    await db.delete(transitions).where(eq(transitions.id, id));
  }

  async getNextTransitionNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(transitions);
    const num = (result?.count || 0) + 1;
    return `TRN-${String(num).padStart(4, '0')}`;
  }

  async getTransitionTasks(transitionId: string): Promise<TransitionTask[]> {
    return await db.select().from(transitionTasks)
      .where(eq(transitionTasks.transitionId, transitionId))
      .orderBy(transitionTasks.sortOrder);
  }

  async getTransitionTask(id: string): Promise<TransitionTask | undefined> {
    const [task] = await db.select().from(transitionTasks).where(eq(transitionTasks.id, id));
    return task || undefined;
  }

  async createTransitionTask(insertTask: InsertTransitionTask): Promise<TransitionTask> {
    const [task] = await db.insert(transitionTasks).values(insertTask).returning();
    return task;
  }

  async updateTransitionTask(id: string, updates: Partial<InsertTransitionTask>): Promise<TransitionTask> {
    const [task] = await db.update(transitionTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transitionTasks.id, id))
      .returning();
    if (!task) throw new Error(`Transition task with id ${id} not found`);
    return task;
  }

  async deleteTransitionTask(id: string): Promise<void> {
    await db.delete(transitionTasks).where(eq(transitionTasks.id, id));
  }

  // ========== MODULE F: WORK ORDERS ==========
  async getWorkOrders(filters?: { customerId?: string; locationId?: string; status?: string; priority?: string }): Promise<WorkOrder[]> {
    let query = db.select().from(workOrders);
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(workOrders.customerId, filters.customerId));
    if (filters?.locationId) conditions.push(eq(workOrders.locationId, filters.locationId));
    if (filters?.status) conditions.push(eq(workOrders.status, filters.status));
    if (filters?.priority) conditions.push(eq(workOrders.priority, filters.priority));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(workOrders.scheduledDate));
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return workOrder || undefined;
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const workOrderNumber = await this.getNextWorkOrderNumber();
    const [workOrder] = await db.insert(workOrders).values({ ...insertWorkOrder, workOrderNumber }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'workOrder',
      entityId: workOrder.id,
      action: 'created',
      details: { workOrderNumber, title: workOrder.title },
    });
    return workOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [workOrder] = await db.update(workOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    if (!workOrder) throw new Error(`Work order with id ${id} not found`);
    return workOrder;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }

  async getNextWorkOrderNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(workOrders);
    const num = (result?.count || 0) + 1;
    return `WO-${String(num).padStart(4, '0')}`;
  }

  // Service Logs
  async getServiceLogs(serviceModuleId: string): Promise<ServiceLog[]> {
    return await db.select().from(serviceLogs)
      .where(eq(serviceLogs.serviceModuleId, serviceModuleId))
      .orderBy(desc(serviceLogs.serviceDate));
  }

  async getServiceLog(id: string): Promise<ServiceLog | undefined> {
    const [log] = await db.select().from(serviceLogs).where(eq(serviceLogs.id, id));
    return log || undefined;
  }

  async createServiceLog(insertLog: InsertServiceLog): Promise<ServiceLog> {
    const [log] = await db.insert(serviceLogs).values(insertLog).returning();
    return log;
  }

  async updateServiceLog(id: string, updates: Partial<InsertServiceLog>): Promise<ServiceLog> {
    const [log] = await db.update(serviceLogs).set(updates).where(eq(serviceLogs.id, id)).returning();
    if (!log) throw new Error(`Service log with id ${id} not found`);
    return log;
  }

  async deleteServiceLog(id: string): Promise<void> {
    await db.delete(serviceLogs).where(eq(serviceLogs.id, id));
  }

  // Incidents
  async getIncidents(filters?: { customerId?: string; status?: string; priority?: string }): Promise<Incident[]> {
    let query = db.select().from(incidents);
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(incidents.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(incidents.status, filters.status));
    if (filters?.priority) conditions.push(eq(incidents.priority, filters.priority));
    if (conditions.length > 0) query = query.where(and(...conditions)) as any;
    return await query.orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const incidentNumber = await this.getNextIncidentNumber();
    const [incident] = await db.insert(incidents).values({ ...insertIncident, incidentNumber }).returning();
    await this.createActivityLog({
      userId: null,
      entityType: 'incident',
      entityId: incident.id,
      action: 'created',
      details: { incidentNumber, title: incident.title },
    });
    return incident;
  }

  async updateIncident(id: string, updates: Partial<InsertIncident>): Promise<Incident> {
    const [incident] = await db.update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    if (!incident) throw new Error(`Incident with id ${id} not found`);
    return incident;
  }

  async deleteIncident(id: string): Promise<void> {
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  async getNextIncidentNumber(): Promise<string> {
    const [result] = await db.select({ count: count() }).from(incidents);
    const num = (result?.count || 0) + 1;
    return `INC-${String(num).padStart(4, '0')}`;
  }

  async initializeDefaults(): Promise<void> {
    const existingCategories = await this.getServiceCategories();
    if (existingCategories.length === 0) {
      const defaultCategories = [
        { name: "HVAC Systems", description: "Heating, ventilation, and air conditioning", color: "#3B82F6" },
        { name: "Vertical Transport", description: "Elevators and escalators", color: "#8B5CF6" },
        { name: "Fire Safety", description: "Fire detection and suppression systems", color: "#10B981" },
        { name: "Security Systems", description: "Access control and surveillance", color: "#6B7280" },
        { name: "Cleaning Services", description: "Facility cleaning and maintenance", color: "#F59E0B" },
        { name: "Electrical Systems", description: "Power distribution and lighting", color: "#EF4444" },
      ];
      for (const cat of defaultCategories) {
        await this.createServiceCategory(cat);
      }
    }

    const existingTemplates = await this.getServiceTemplates();
    if (existingTemplates.length === 0) {
      const categories = await this.getServiceCategories();
      if (categories.length > 0) {
        const defaultTemplates = [
          {
            templateName: "HVAC Maintenance Check",
            categoryId: categories.find(c => c.name === "HVAC Systems")?.id || categories[0].id,
            description: "Regular maintenance check for HVAC systems",
            fields: [
              { id: "temperature", label: "Temperature Reading", type: "number", required: true },
              { id: "airflow", label: "Air Flow Rate", type: "number", required: true },
              { id: "filter_status", label: "Filter Status", type: "dropdown", required: true, options: ["Clean", "Dirty", "Replace"] },
              { id: "notes", label: "Maintenance Notes", type: "textarea", required: false }
            ]
          },
          {
            templateName: "Elevator Inspection",
            categoryId: categories.find(c => c.name === "Vertical Transport")?.id || categories[1 % categories.length].id,
            description: "Safety inspection for elevators",
            fields: [
              { id: "safety_check", label: "Safety Systems Check", type: "checkbox", required: true },
              { id: "load_test", label: "Load Test Passed", type: "checkbox", required: true },
              { id: "inspection_date", label: "Last Inspection Date", type: "date", required: true },
              { id: "certificate", label: "Inspection Certificate", type: "file", required: false }
            ]
          },
          {
            templateName: "Fire Safety Inspection",
            categoryId: categories.find(c => c.name === "Fire Safety")?.id || categories[2 % categories.length].id,
            description: "Fire safety system inspection",
            fields: [
              { id: "alarm_test", label: "Alarm System Test", type: "checkbox", required: true },
              { id: "extinguisher_check", label: "Fire Extinguisher Check", type: "dropdown", required: true, options: ["Pass", "Needs Refill", "Replace"] },
              { id: "exit_signs", label: "Emergency Exit Signs", type: "checkbox", required: true }
            ]
          }
        ];
        for (const template of defaultTemplates) {
          await this.createServiceTemplate(template as InsertServiceTemplate);
        }
      }
    }

    const existingContractTypes = await this.getContractTypes();
    if (existingContractTypes.length === 0) {
      const defaultContractTypes = [
        {
          name: "Managed Contract",
          templateType: "managed",
          serviceScope: "Drift og vedligehold af ventilation i bygning 12–15",
          performanceKpis: ["Oppetid > 99%", "Responstid < 2 timer"],
          paymentModel: "fixed-monthly",
          feeAmount: "25000",
          reportingFrequency: "monthly",
          governanceFrequency: "Kvartalsvist",
          bonusPenaltyRules: "+3% bonus ved 100% KPI, -5% hvis <95%",
          changeManagementProcess: "Ændringer godkendes via Change Request-formular",
        },
        {
          name: "Cost-Plus Contract",
          templateType: "cost-plus",
          costBaseDefinition: "Timer, materialer, transport, underleverandører",
          markupType: "percent",
          markupValue: "10",
          paymentFrequency: "monthly",
          documentationRequirements: "Bilag, timesedler, fakturaer",
          costCap: "3000000",
          auditRights: true,
          bonusCriteria: "+5% hvis projekt afsluttes under budget",
          riskSharingAgreement: "50/50 over 10% afvigelse",
        }
      ];
      for (const ct of defaultContractTypes) {
        await this.createContractType(ct as InsertContractType);
      }
    }

    // Initialize default users
    const existingUsers = await this.getUsers();
    if (existingUsers.length === 0) {
      const defaultUsers = [
        {
          username: "admin",
          password: "admin123",
          email: "admin@matrixx360.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin"
        },
        {
          username: "manager",
          password: "manager123",
          email: "manager@matrixx360.com",
          firstName: "Project",
          lastName: "Manager",
          role: "manager"
        },
        {
          username: "technician",
          password: "tech123",
          email: "tech@matrixx360.com",
          firstName: "Field",
          lastName: "Technician",
          role: "technician"
        }
      ];
      for (const user of defaultUsers) {
        await this.createUser(user as InsertUser);
      }
    }

    // Initialize default suppliers
    const existingSuppliers = await this.getSuppliers();
    if (existingSuppliers.length === 0) {
      const categories = await this.getServiceCategories();
      const defaultSuppliers = [
        {
          name: "TechService A/S",
          cvrNumber: "12345678",
          email: "kontakt@techservice.dk",
          phone: "+45 70 12 34 56",
          address: "Industrivej 15, 2600 Glostrup",
          categories: [categories[0]?.id, categories[1]?.id].filter(Boolean),
          qualityRating: "4.5",
          priceRating: "4.0",
          notes: "Foretrukken leverandør til tekniske services"
        },
        {
          name: "Facility Solutions ApS",
          cvrNumber: "87654321",
          email: "info@facilitysolutions.dk",
          phone: "+45 33 45 67 89",
          address: "Servicevej 22, 2100 København Ø",
          categories: [categories[2]?.id, categories[3]?.id].filter(Boolean),
          qualityRating: "4.2",
          priceRating: "3.8",
          notes: "Specialiseret i sikkerhedsløsninger"
        },
        {
          name: "CleanPro Danmark",
          cvrNumber: "11223344",
          email: "service@cleanpro.dk",
          phone: "+45 21 34 56 78",
          address: "Rengøringsvej 8, 5000 Odense C",
          categories: [categories[4]?.id].filter(Boolean),
          qualityRating: "4.8",
          priceRating: "4.5",
          notes: "Top-rated rengøringsleverandør"
        }
      ];
      for (const supplier of defaultSuppliers) {
        await this.createSupplier(supplier as InsertSupplier);
      }
    }
  }
}

export const storage = new DatabaseStorage();
