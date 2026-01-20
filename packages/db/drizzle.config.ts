import type { Config } from 'drizzle-kit';

export default {
  schema: './dist/schema/index.js',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'postgres',
  },
} satisfies Config;
