import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

function getConnectionString(): string {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  
  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  }
  
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('supabase.com')) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "Database connection not configured. Please provision a PostgreSQL database.",
  );
}

export const pool = new Pool({ connectionString: getConnectionString() });
export const db = drizzle({ client: pool, schema });
