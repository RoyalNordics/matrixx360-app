CREATE TABLE "activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"street" text,
	"street_number" text,
	"city" text,
	"zip_code" text,
	"main_phone" text,
	"category" text,
	"cvr_number" text,
	"main_contact_name" text,
	"main_contact_email" text,
	"main_contact_phone" text,
	"main_contact_role" text,
	"business_unit_name" text,
	"business_unit_id" text,
	"business_unit_address" text,
	"business_unit_city" text,
	"business_unit_zip" text,
	"business_unit_employees" integer,
	"business_unit_contact_name" text,
	"business_unit_contact_phone" text,
	"business_unit_contact_email" text,
	"business_unit_contact_role" text,
	"number_of_dishes" integer,
	"number_of_canteen_users" integer,
	"meal_size_grams" integer,
	"cost_per_meal" numeric(10, 2),
	"vegetarian" boolean DEFAULT false,
	"organic" boolean DEFAULT false,
	"fast_food" boolean DEFAULT false,
	"warm" boolean DEFAULT false,
	"nutritional_info" jsonb DEFAULT '[]'::jsonb,
	"organic_products_percentage" integer DEFAULT 0,
	"earnings_model" text,
	"cost_plus_level" text,
	"bonus_models" jsonb DEFAULT '[]'::jsonb,
	"kpis_measured" text,
	"agreed_level" text,
	"logo_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"name" text NOT NULL,
	"street" text,
	"street_number" text,
	"city" text,
	"zip_code" text,
	"main_phone" text,
	"category" text,
	"main_contact_name" text,
	"main_contact_email" text,
	"main_contact_phone" text,
	"main_contact_role" text,
	"business_unit_name" text,
	"business_unit_id" text,
	"business_unit_address" text,
	"business_unit_city" text,
	"business_unit_zip" text,
	"business_unit_employees" integer,
	"business_unit_contact_name" text,
	"business_unit_contact_phone" text,
	"business_unit_contact_email" text,
	"business_unit_contact_role" text,
	"number_of_dishes" integer,
	"number_of_canteen_users" integer,
	"meal_size_grams" integer,
	"cost_per_meal" numeric(10, 2),
	"vegetarian" boolean DEFAULT false,
	"organic" boolean DEFAULT false,
	"fast_food" boolean DEFAULT false,
	"warm" boolean DEFAULT false,
	"nutritional_info" jsonb DEFAULT '[]'::jsonb,
	"organic_products_percentage" integer DEFAULT 0,
	"earnings_model" text,
	"cost_plus_level" text,
	"bonus_models" jsonb DEFAULT '[]'::jsonb,
	"kpis_measured" text,
	"agreed_level" text,
	"gps_coordinates" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "service_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" text NOT NULL,
	"customer_id" varchar NOT NULL,
	"location_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"supplier_id" varchar,
	"responsible_user_id" varchar,
	"field_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"next_service_date" timestamp,
	"last_service_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_modules_module_id_unique" UNIQUE("module_id")
);
--> statement-breakpoint
CREATE TABLE "service_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_name" text NOT NULL,
	"category_id" varchar NOT NULL,
	"description" text,
	"fields" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cvr_number" text,
	"address" text,
	"email" text,
	"phone" text,
	"contact_persons" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quality_rating" numeric(2, 1) DEFAULT '0',
	"price_rating" numeric(2, 1) DEFAULT '0',
	"documents" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'technician' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_template_id_service_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."service_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_modules" ADD CONSTRAINT "service_modules_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_templates" ADD CONSTRAINT "service_templates_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;