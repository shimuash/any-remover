/**
 * Connect to PostgreSQL Database (Supabase/Neon/Local PostgreSQL)
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
// import { getCloudflareContext } from '@opennextjs/cloudflare';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
import { drizzle } from "drizzle-orm/neon-http";
import { cache } from "react";
import * as schema from "./schema";


// let db: ReturnType<typeof drizzle> | null = null;

// https://opennext.js.org/cloudflare/howtos/db#postgresql
// export async function getDb() {
//   if (db) return db;
//   const { env } = await getCloudflareContext({ async: true });
//   const pool = new Pool({
//     connectionString: env.HYPERDRIVE.connectionString,
//     // You don't want to reuse the same connection for multiple requests
//     maxUses: 1,
//   });
//   db = drizzle({ client: pool, schema });
//   return db;
// }

export const getDb = cache(async () => {
  return drizzle(process.env.DATABASE_URL!, { schema });
});

/**
 * Connect to Neon Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 */
// import { drizzle } from 'drizzle-orm/neon-http';
// const db = drizzle(process.env.DATABASE_URL!);

/**
 * Database connection with Drizzle
 * https://orm.drizzle.team/docs/connect-overview
 *
 * Drizzle <> PostgreSQL
 * https://orm.drizzle.team/docs/get-started-postgresql
 *
 * Get Started with Drizzle and Neon
 * https://orm.drizzle.team/docs/get-started/neon-new
 *
 * Drizzle with Neon Postgres
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 *
 * Drizzle <> Neon Postgres
 * https://orm.drizzle.team/docs/connect-neon
 *
 * Drizzle with Supabase Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
