import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  insertCustomerSchema, insertLocationSchema, insertContactPersonSchema, insertServiceCategorySchema,
  insertServiceTemplateSchema, insertSupplierSchema, insertServiceModuleSchema, insertContractTypeSchema,
  insertSalesCaseSchema, insertSalesActivitySchema, insertSalesNoteSchema, insertSalesCaseModuleSchema,
  insertRfqSchema, insertRfqServiceModuleSchema, insertRfqSupplierSchema, insertRfqQuoteSchema,
  insertProposalSchema, insertProposalLineItemSchema, insertContractSchema,
  insertTransitionSchema, insertTransitionTaskSchema,
  insertWorkOrderSchema, insertServiceLogSchema, insertIncidentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const objectStorageService = new ObjectStorageService();

  // Object Storage Routes
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/objects/finalize", async (req, res) => {
    if (!req.body.objectURL) {
      return res.status(400).json({ error: "objectURL is required" });
    }

    try {
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.objectURL);
      res.json({ objectPath });
    } catch (error) {
      console.error("Error finalizing object upload:", error);
      res.status(500).json({ error: "Failed to finalize upload" });
    }
  });

  // Dashboard Analytics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/activity-log", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivityLog(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error getting activity log:", error);
      res.status(500).json({ error: "Failed to get activity log" });
    }
  });

  // Contract Type Routes
  app.get("/api/contract-types", async (req, res) => {
    try {
      const contractTypes = await storage.getContractTypes();
      res.json(contractTypes);
    } catch (error) {
      console.error("Error getting contract types:", error);
      res.status(500).json({ error: "Failed to get contract types" });
    }
  });

  app.get("/api/contract-types/:id", async (req, res) => {
    try {
      const contractType = await storage.getContractType(req.params.id);
      if (!contractType) {
        return res.status(404).json({ error: "Contract type not found" });
      }
      res.json(contractType);
    } catch (error) {
      console.error("Error getting contract type:", error);
      res.status(500).json({ error: "Failed to get contract type" });
    }
  });

  app.post("/api/contract-types", async (req, res) => {
    try {
      const validatedData = insertContractTypeSchema.parse(req.body);
      const contractType = await storage.createContractType(validatedData);
      res.status(201).json(contractType);
    } catch (error) {
      console.error("Error creating contract type:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create contract type" });
    }
  });

  app.put("/api/contract-types/:id", async (req, res) => {
    try {
      const validatedData = insertContractTypeSchema.partial().parse(req.body);
      const contractType = await storage.updateContractType(req.params.id, validatedData);
      res.json(contractType);
    } catch (error) {
      console.error("Error updating contract type:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update contract type" });
    }
  });

  app.delete("/api/contract-types/:id", async (req, res) => {
    try {
      await storage.deleteContractType(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting contract type:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete contract type" });
    }
  });

  // Customer Routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error getting customers:", error);
      res.status(500).json({ error: "Failed to get customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error getting customer:", error);
      res.status(500).json({ error: "Failed to get customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete customer" });
    }
  });

  // Location Routes
  app.get("/api/customers/:customerId/locations", async (req, res) => {
    try {
      const locations = await storage.getLocationsByCustomer(req.params.customerId);
      res.json(locations);
    } catch (error) {
      console.error("Error getting locations:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });

  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error getting location:", error);
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create location" });
    }
  });

  app.post("/api/locations/bulk", async (req, res) => {
    try {
      const locationsArray = Array.isArray(req.body) ? req.body : [req.body];
      const validatedLocations = locationsArray.map(loc => insertLocationSchema.parse(loc));
      const createdLocations = await storage.createLocationsBulk(validatedLocations);
      res.status(201).json(createdLocations);
    } catch (error) {
      console.error("Error creating locations in bulk:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create locations" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(req.params.id, validatedData);
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete location" });
    }
  });

  // Contact Person Routes
  app.get("/api/locations/:locationId/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContactPersonsByLocation(req.params.locationId);
      res.json(contacts);
    } catch (error) {
      console.error("Error getting contact persons:", error);
      res.status(500).json({ error: "Failed to get contact persons" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContactPerson(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact person not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error getting contact person:", error);
      res.status(500).json({ error: "Failed to get contact person" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactPersonSchema.parse(req.body);
      const contact = await storage.createContactPerson(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact person:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create contact person" });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const validatedData = insertContactPersonSchema.partial().parse(req.body);
      const contact = await storage.updateContactPerson(req.params.id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact person:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update contact person" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      await storage.deleteContactPerson(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting contact person:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete contact person" });
    }
  });

  // Service Category Routes
  app.get("/api/service-categories", async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error getting service categories:", error);
      res.status(500).json({ error: "Failed to get service categories" });
    }
  });

  app.post("/api/service-categories", async (req, res) => {
    try {
      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating service category:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create service category" });
    }
  });

  // Service Template Routes
  app.get("/api/service-templates", async (req, res) => {
    try {
      const templates = await storage.getServiceTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error getting service templates:", error);
      res.status(500).json({ error: "Failed to get service templates" });
    }
  });

  app.get("/api/service-templates/:id", async (req, res) => {
    try {
      const template = await storage.getServiceTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Service template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error getting service template:", error);
      res.status(500).json({ error: "Failed to get service template" });
    }
  });

  app.post("/api/service-templates", async (req, res) => {
    try {
      const validatedData = insertServiceTemplateSchema.parse(req.body);
      const template = await storage.createServiceTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating service template:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create service template" });
    }
  });

  app.put("/api/service-templates/:id", async (req, res) => {
    try {
      const validatedData = insertServiceTemplateSchema.partial().parse(req.body);
      const template = await storage.updateServiceTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error updating service template:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update service template" });
    }
  });

  app.delete("/api/service-templates/:id", async (req, res) => {
    try {
      await storage.deleteServiceTemplate(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting service template:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete service template" });
    }
  });

  // Supplier Routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const suppliers = categoryId 
        ? await storage.getSuppliersByCategory(categoryId)
        : await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error getting suppliers:", error);
      res.status(500).json({ error: "Failed to get suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error getting supplier:", error);
      res.status(500).json({ error: "Failed to get supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete supplier" });
    }
  });

  // User Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Service Module Routes
  app.get("/api/service-modules", async (req, res) => {
    try {
      const filters = {
        customerId: req.query.customerId as string,
        locationId: req.query.locationId as string,
        categoryId: req.query.categoryId as string,
        responsibleUserId: req.query.responsibleUserId as string,
        status: req.query.status as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const result = await storage.getServiceModules(filters);
      res.json(result);
    } catch (error) {
      console.error("Error getting service modules:", error);
      res.status(500).json({ error: "Failed to get service modules" });
    }
  });

  app.get("/api/service-modules/:id", async (req, res) => {
    try {
      const module = await storage.getServiceModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Service module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error getting service module:", error);
      res.status(500).json({ error: "Failed to get service module" });
    }
  });

  app.post("/api/service-modules", async (req, res) => {
    try {
      const validatedData = insertServiceModuleSchema.parse(req.body);
      const module = await storage.createServiceModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating service module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create service module" });
    }
  });

  app.post("/api/service-modules/bulk", async (req, res) => {
    try {
      const modulesArray = Array.isArray(req.body) ? req.body : [req.body];
      const validatedModules = modulesArray.map(module => insertServiceModuleSchema.parse(module));
      const createdModules = await storage.createServiceModulesBulk(validatedModules);
      res.status(201).json(createdModules);
    } catch (error) {
      console.error("Error creating service modules in bulk:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create service modules" });
    }
  });

  app.put("/api/service-modules/:id", async (req, res) => {
    try {
      const validatedData = insertServiceModuleSchema.partial().parse(req.body);
      const module = await storage.updateServiceModule(req.params.id, validatedData);
      res.json(module);
    } catch (error) {
      console.error("Error updating service module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update service module" });
    }
  });

  app.delete("/api/service-modules/:id", async (req, res) => {
    try {
      await storage.deleteServiceModule(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting service module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete service module" });
    }
  });

  // ============================================
  // Sales Pipeline Routes
  // ============================================

  // Sales Pipeline Stats
  app.get("/api/sales/pipeline-stats", async (req, res) => {
    try {
      const stats = await storage.getSalesPipelineStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting pipeline stats:", error);
      res.status(500).json({ error: "Failed to get pipeline stats" });
    }
  });

  // Sales Cases
  app.get("/api/sales-cases", async (req, res) => {
    try {
      const filters: { status?: string; customerId?: string; ownerUserId?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.ownerUserId) filters.ownerUserId = req.query.ownerUserId as string;
      
      const salesCases = await storage.getSalesCases(filters);
      res.json(salesCases);
    } catch (error) {
      console.error("Error getting sales cases:", error);
      res.status(500).json({ error: "Failed to get sales cases" });
    }
  });

  app.get("/api/sales-cases/:id", async (req, res) => {
    try {
      const salesCase = await storage.getSalesCase(req.params.id);
      if (!salesCase) {
        return res.status(404).json({ error: "Sales case not found" });
      }
      res.json(salesCase);
    } catch (error) {
      console.error("Error getting sales case:", error);
      res.status(500).json({ error: "Failed to get sales case" });
    }
  });

  app.post("/api/sales-cases", async (req, res) => {
    try {
      const validatedData = insertSalesCaseSchema.parse(req.body);
      const salesCase = await storage.createSalesCase(validatedData);
      res.status(201).json(salesCase);
    } catch (error) {
      console.error("Error creating sales case:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create sales case" });
    }
  });

  app.put("/api/sales-cases/:id", async (req, res) => {
    try {
      const validatedData = insertSalesCaseSchema.partial().parse(req.body);
      const salesCase = await storage.updateSalesCase(req.params.id, validatedData);
      res.json(salesCase);
    } catch (error) {
      console.error("Error updating sales case:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update sales case" });
    }
  });

  app.delete("/api/sales-cases/:id", async (req, res) => {
    try {
      await storage.deleteSalesCase(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting sales case:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete sales case" });
    }
  });

  // Sales Activities
  app.get("/api/sales-cases/:salesCaseId/activities", async (req, res) => {
    try {
      const activities = await storage.getSalesActivities(req.params.salesCaseId);
      res.json(activities);
    } catch (error) {
      console.error("Error getting sales activities:", error);
      res.status(500).json({ error: "Failed to get sales activities" });
    }
  });

  app.post("/api/sales-cases/:salesCaseId/activities", async (req, res) => {
    try {
      const validatedData = insertSalesActivitySchema.parse({
        ...req.body,
        salesCaseId: req.params.salesCaseId,
      });
      const activity = await storage.createSalesActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating sales activity:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create sales activity" });
    }
  });

  app.put("/api/sales-activities/:id", async (req, res) => {
    try {
      const validatedData = insertSalesActivitySchema.partial().parse(req.body);
      const activity = await storage.updateSalesActivity(req.params.id, validatedData);
      res.json(activity);
    } catch (error) {
      console.error("Error updating sales activity:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update sales activity" });
    }
  });

  app.delete("/api/sales-activities/:id", async (req, res) => {
    try {
      await storage.deleteSalesActivity(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting sales activity:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete sales activity" });
    }
  });

  // Sales Notes
  app.get("/api/sales-cases/:salesCaseId/notes", async (req, res) => {
    try {
      const notes = await storage.getSalesNotes(req.params.salesCaseId);
      res.json(notes);
    } catch (error) {
      console.error("Error getting sales notes:", error);
      res.status(500).json({ error: "Failed to get sales notes" });
    }
  });

  app.post("/api/sales-cases/:salesCaseId/notes", async (req, res) => {
    try {
      const validatedData = insertSalesNoteSchema.parse({
        ...req.body,
        salesCaseId: req.params.salesCaseId,
      });
      const note = await storage.createSalesNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating sales note:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create sales note" });
    }
  });

  app.put("/api/sales-notes/:id", async (req, res) => {
    try {
      const validatedData = insertSalesNoteSchema.partial().parse(req.body);
      const note = await storage.updateSalesNote(req.params.id, validatedData);
      res.json(note);
    } catch (error) {
      console.error("Error updating sales note:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update sales note" });
    }
  });

  app.delete("/api/sales-notes/:id", async (req, res) => {
    try {
      await storage.deleteSalesNote(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting sales note:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete sales note" });
    }
  });

  // Sales Case Modules (Preliminary Scope)
  app.get("/api/sales-cases/:salesCaseId/modules", async (req, res) => {
    try {
      const modules = await storage.getSalesCaseModules(req.params.salesCaseId);
      res.json(modules);
    } catch (error) {
      console.error("Error getting sales case modules:", error);
      res.status(500).json({ error: "Failed to get sales case modules" });
    }
  });

  app.post("/api/sales-cases/:salesCaseId/modules", async (req, res) => {
    try {
      const validatedData = insertSalesCaseModuleSchema.parse({
        ...req.body,
        salesCaseId: req.params.salesCaseId,
      });
      const module = await storage.createSalesCaseModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating sales case module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create sales case module" });
    }
  });

  app.delete("/api/sales-case-modules/:id", async (req, res) => {
    try {
      await storage.deleteSalesCaseModule(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting sales case module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete sales case module" });
    }
  });

  // ========== MODULE C: RFQ (Request for Quote) Routes ==========

  // RFQ CRUD
  app.get("/api/rfqs", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        customerId: req.query.customerId as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
      };
      const rfqs = await storage.getRfqs(filters);
      res.json(rfqs);
    } catch (error) {
      console.error("Error getting RFQs:", error);
      res.status(500).json({ error: "Failed to get RFQs" });
    }
  });

  app.get("/api/rfqs/:id", async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error) {
      console.error("Error getting RFQ:", error);
      res.status(500).json({ error: "Failed to get RFQ" });
    }
  });

  app.post("/api/rfqs", async (req, res) => {
    try {
      const validatedData = insertRfqSchema.parse(req.body);
      const rfq = await storage.createRfq(validatedData);
      res.status(201).json(rfq);
    } catch (error) {
      console.error("Error creating RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create RFQ" });
    }
  });

  app.put("/api/rfqs/:id", async (req, res) => {
    try {
      const validatedData = insertRfqSchema.partial().parse(req.body);
      const rfq = await storage.updateRfq(req.params.id, validatedData);
      res.json(rfq);
    } catch (error) {
      console.error("Error updating RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update RFQ" });
    }
  });

  app.delete("/api/rfqs/:id", async (req, res) => {
    try {
      await storage.deleteRfq(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete RFQ" });
    }
  });

  // Send RFQ to suppliers (changes status to 'sent')
  app.post("/api/rfqs/:id/send", async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      
      // Check minimum suppliers requirement
      const suppliers = await storage.getRfqSuppliers(req.params.id);
      if (suppliers.length < 3) {
        return res.status(400).json({ 
          error: "Minimum 3 suppliers required to send RFQ",
          currentCount: suppliers.length 
        });
      }
      
      const updated = await storage.updateRfq(req.params.id, {
        status: 'sent',
        sentAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      console.error("Error sending RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to send RFQ" });
    }
  });

  // RFQ Service Modules
  app.get("/api/rfqs/:rfqId/service-modules", async (req, res) => {
    try {
      const modules = await storage.getRfqServiceModules(req.params.rfqId);
      res.json(modules);
    } catch (error) {
      console.error("Error getting RFQ service modules:", error);
      res.status(500).json({ error: "Failed to get RFQ service modules" });
    }
  });

  app.post("/api/rfqs/:rfqId/service-modules", async (req, res) => {
    try {
      const validatedData = insertRfqServiceModuleSchema.parse({
        ...req.body,
        rfqId: req.params.rfqId,
      });
      const module = await storage.createRfqServiceModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating RFQ service module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create RFQ service module" });
    }
  });

  app.delete("/api/rfq-service-modules/:id", async (req, res) => {
    try {
      await storage.deleteRfqServiceModule(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting RFQ service module:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete RFQ service module" });
    }
  });

  // RFQ Suppliers (Invited suppliers)
  app.get("/api/rfqs/:rfqId/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getRfqSuppliers(req.params.rfqId);
      res.json(suppliers);
    } catch (error) {
      console.error("Error getting RFQ suppliers:", error);
      res.status(500).json({ error: "Failed to get RFQ suppliers" });
    }
  });

  app.post("/api/rfqs/:rfqId/suppliers", async (req, res) => {
    try {
      const validatedData = insertRfqSupplierSchema.parse({
        ...req.body,
        rfqId: req.params.rfqId,
      });
      const supplier = await storage.createRfqSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error inviting supplier to RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to invite supplier to RFQ" });
    }
  });

  app.put("/api/rfq-suppliers/:id", async (req, res) => {
    try {
      const validatedData = insertRfqSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateRfqSupplier(req.params.id, validatedData);
      res.json(supplier);
    } catch (error) {
      console.error("Error updating RFQ supplier:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update RFQ supplier" });
    }
  });

  app.delete("/api/rfq-suppliers/:id", async (req, res) => {
    try {
      await storage.deleteRfqSupplier(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error removing supplier from RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to remove supplier from RFQ" });
    }
  });

  // RFQ Quotes (Supplier responses)
  app.get("/api/rfqs/:rfqId/quotes", async (req, res) => {
    try {
      const quotes = await storage.getRfqQuotes(req.params.rfqId);
      res.json(quotes);
    } catch (error) {
      console.error("Error getting RFQ quotes:", error);
      res.status(500).json({ error: "Failed to get RFQ quotes" });
    }
  });

  app.get("/api/rfq-quotes/:id", async (req, res) => {
    try {
      const quote = await storage.getRfqQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ error: "RFQ Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error getting RFQ quote:", error);
      res.status(500).json({ error: "Failed to get RFQ quote" });
    }
  });

  app.post("/api/rfqs/:rfqId/quotes", async (req, res) => {
    try {
      const validatedData = insertRfqQuoteSchema.parse({
        ...req.body,
        rfqId: req.params.rfqId,
      });
      const quote = await storage.createRfqQuote(validatedData);
      res.status(201).json(quote);
    } catch (error) {
      console.error("Error creating RFQ quote:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create RFQ quote" });
    }
  });

  app.put("/api/rfq-quotes/:id", async (req, res) => {
    try {
      const validatedData = insertRfqQuoteSchema.partial().parse(req.body);
      const quote = await storage.updateRfqQuote(req.params.id, validatedData);
      res.json(quote);
    } catch (error) {
      console.error("Error updating RFQ quote:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update RFQ quote" });
    }
  });

  app.delete("/api/rfq-quotes/:id", async (req, res) => {
    try {
      await storage.deleteRfqQuote(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting RFQ quote:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete RFQ quote" });
    }
  });

  // Benchmark Engine - Calculate scores for all quotes in an RFQ
  app.post("/api/rfqs/:id/calculate-benchmarks", async (req, res) => {
    try {
      const quotes = await storage.calculateBenchmarkScores(req.params.id);
      res.json({ 
        message: "Benchmark scores calculated successfully",
        quotes 
      });
    } catch (error) {
      console.error("Error calculating benchmark scores:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to calculate benchmark scores" });
    }
  });

  // Award RFQ to a supplier
  app.post("/api/rfqs/:id/award", async (req, res) => {
    try {
      const { supplierId, reason } = req.body;
      if (!supplierId) {
        return res.status(400).json({ error: "supplierId is required" });
      }
      
      const rfq = await storage.awardRfq(req.params.id, supplierId, reason || "");
      res.json({
        message: "RFQ awarded successfully",
        rfq
      });
    } catch (error) {
      console.error("Error awarding RFQ:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to award RFQ" });
    }
  });

  // Get RFQ with all related data (enriched view)
  app.get("/api/rfqs/:id/full", async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      
      const [serviceModules, suppliers, quotes] = await Promise.all([
        storage.getRfqServiceModules(req.params.id),
        storage.getRfqSuppliers(req.params.id),
        storage.getRfqQuotes(req.params.id),
      ]);
      
      res.json({
        ...rfq,
        serviceModules,
        suppliers,
        quotes,
      });
    } catch (error) {
      console.error("Error getting full RFQ:", error);
      res.status(500).json({ error: "Failed to get full RFQ" });
    }
  });

  // ========== MODULE D: PROPOSALS ==========
  app.get("/api/proposals", async (req, res) => {
    try {
      const filters: { customerId?: string; status?: string } = {};
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.status) filters.status = req.query.status as string;
      const proposals = await storage.getProposals(filters);
      res.json(proposals);
    } catch (error) {
      console.error("Error getting proposals:", error);
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });

  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      console.error("Error getting proposal:", error);
      res.status(500).json({ error: "Failed to get proposal" });
    }
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const validatedData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(validatedData);
      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create proposal" });
    }
  });

  app.put("/api/proposals/:id", async (req, res) => {
    try {
      const validatedData = insertProposalSchema.partial().parse(req.body);
      const proposal = await storage.updateProposal(req.params.id, validatedData);
      res.json(proposal);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update proposal" });
    }
  });

  app.delete("/api/proposals/:id", async (req, res) => {
    try {
      await storage.deleteProposal(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting proposal:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete proposal" });
    }
  });

  // Proposal Line Items
  app.get("/api/proposals/:proposalId/line-items", async (req, res) => {
    try {
      const lineItems = await storage.getProposalLineItems(req.params.proposalId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error getting proposal line items:", error);
      res.status(500).json({ error: "Failed to get proposal line items" });
    }
  });

  app.post("/api/proposals/:proposalId/line-items", async (req, res) => {
    try {
      const validatedData = insertProposalLineItemSchema.parse({
        ...req.body,
        proposalId: req.params.proposalId,
      });
      const lineItem = await storage.createProposalLineItem(validatedData);
      res.status(201).json(lineItem);
    } catch (error) {
      console.error("Error creating proposal line item:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create line item" });
    }
  });

  app.put("/api/proposal-line-items/:id", async (req, res) => {
    try {
      const validatedData = insertProposalLineItemSchema.partial().parse(req.body);
      const lineItem = await storage.updateProposalLineItem(req.params.id, validatedData);
      res.json(lineItem);
    } catch (error) {
      console.error("Error updating proposal line item:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update line item" });
    }
  });

  app.delete("/api/proposal-line-items/:id", async (req, res) => {
    try {
      await storage.deleteProposalLineItem(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting proposal line item:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete line item" });
    }
  });

  // Contracts
  app.get("/api/contracts", async (req, res) => {
    try {
      const filters: { customerId?: string; status?: string } = {};
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.status) filters.status = req.query.status as string;
      const contracts = await storage.getContracts(filters);
      res.json(contracts);
    } catch (error) {
      console.error("Error getting contracts:", error);
      res.status(500).json({ error: "Failed to get contracts" });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error getting contract:", error);
      res.status(500).json({ error: "Failed to get contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create contract" });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const validatedData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(req.params.id, validatedData);
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete contract" });
    }
  });

  // ========== MODULE E: TRANSITIONS ==========
  app.get("/api/transitions", async (req, res) => {
    try {
      const filters: { customerId?: string; status?: string } = {};
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.status) filters.status = req.query.status as string;
      const transitions = await storage.getTransitions(filters);
      res.json(transitions);
    } catch (error) {
      console.error("Error getting transitions:", error);
      res.status(500).json({ error: "Failed to get transitions" });
    }
  });

  app.get("/api/transitions/:id", async (req, res) => {
    try {
      const transition = await storage.getTransition(req.params.id);
      if (!transition) {
        return res.status(404).json({ error: "Transition not found" });
      }
      res.json(transition);
    } catch (error) {
      console.error("Error getting transition:", error);
      res.status(500).json({ error: "Failed to get transition" });
    }
  });

  app.post("/api/transitions", async (req, res) => {
    try {
      const validatedData = insertTransitionSchema.parse(req.body);
      const transition = await storage.createTransition(validatedData);
      res.status(201).json(transition);
    } catch (error) {
      console.error("Error creating transition:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create transition" });
    }
  });

  app.put("/api/transitions/:id", async (req, res) => {
    try {
      const validatedData = insertTransitionSchema.partial().parse(req.body);
      const transition = await storage.updateTransition(req.params.id, validatedData);
      res.json(transition);
    } catch (error) {
      console.error("Error updating transition:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update transition" });
    }
  });

  app.delete("/api/transitions/:id", async (req, res) => {
    try {
      await storage.deleteTransition(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting transition:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete transition" });
    }
  });

  // Transition Tasks
  app.get("/api/transitions/:transitionId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTransitionTasks(req.params.transitionId);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting transition tasks:", error);
      res.status(500).json({ error: "Failed to get transition tasks" });
    }
  });

  app.post("/api/transitions/:transitionId/tasks", async (req, res) => {
    try {
      const validatedData = insertTransitionTaskSchema.parse({
        ...req.body,
        transitionId: req.params.transitionId,
      });
      const task = await storage.createTransitionTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating transition task:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create task" });
    }
  });

  app.put("/api/transition-tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTransitionTaskSchema.partial().parse(req.body);
      const task = await storage.updateTransitionTask(req.params.id, validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error updating transition task:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update task" });
    }
  });

  app.delete("/api/transition-tasks/:id", async (req, res) => {
    try {
      await storage.deleteTransitionTask(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting transition task:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete task" });
    }
  });

  // ========== MODULE F: WORK ORDERS ==========
  app.get("/api/work-orders", async (req, res) => {
    try {
      const filters: { customerId?: string; locationId?: string; status?: string; priority?: string } = {};
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.locationId) filters.locationId = req.query.locationId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      const workOrders = await storage.getWorkOrders(filters);
      res.json(workOrders);
    } catch (error) {
      console.error("Error getting work orders:", error);
      res.status(500).json({ error: "Failed to get work orders" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error getting work order:", error);
      res.status(500).json({ error: "Failed to get work order" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.parse(req.body);
      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create work order" });
    }
  });

  app.put("/api/work-orders/:id", async (req, res) => {
    try {
      const validatedData = insertWorkOrderSchema.partial().parse(req.body);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update work order" });
    }
  });

  app.delete("/api/work-orders/:id", async (req, res) => {
    try {
      await storage.deleteWorkOrder(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete work order" });
    }
  });

  // Service Logs
  app.get("/api/service-modules/:moduleId/logs", async (req, res) => {
    try {
      const logs = await storage.getServiceLogs(req.params.moduleId);
      res.json(logs);
    } catch (error) {
      console.error("Error getting service logs:", error);
      res.status(500).json({ error: "Failed to get service logs" });
    }
  });

  app.post("/api/service-logs", async (req, res) => {
    try {
      const validatedData = insertServiceLogSchema.parse(req.body);
      const log = await storage.createServiceLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating service log:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create service log" });
    }
  });

  app.put("/api/service-logs/:id", async (req, res) => {
    try {
      const validatedData = insertServiceLogSchema.partial().parse(req.body);
      const log = await storage.updateServiceLog(req.params.id, validatedData);
      res.json(log);
    } catch (error) {
      console.error("Error updating service log:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update service log" });
    }
  });

  app.delete("/api/service-logs/:id", async (req, res) => {
    try {
      await storage.deleteServiceLog(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting service log:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete service log" });
    }
  });

  // Incidents
  app.get("/api/incidents", async (req, res) => {
    try {
      const filters: { customerId?: string; status?: string; priority?: string } = {};
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      const incidents = await storage.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error getting incidents:", error);
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  app.get("/api/incidents/:id", async (req, res) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      console.error("Error getting incident:", error);
      res.status(500).json({ error: "Failed to get incident" });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(validatedData);
      res.status(201).json(incident);
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create incident" });
    }
  });

  app.put("/api/incidents/:id", async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.partial().parse(req.body);
      const incident = await storage.updateIncident(req.params.id, validatedData);
      res.json(incident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update incident" });
    }
  });

  app.delete("/api/incidents/:id", async (req, res) => {
    try {
      await storage.deleteIncident(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete incident" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
