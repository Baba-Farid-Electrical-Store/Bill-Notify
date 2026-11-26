import { z } from 'zod';
const schema = z.object({ DATABASE_URL:z.string().optional(), NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:z.string().optional(), CLERK_SECRET_KEY:z.string().optional(), ALLOWED_EMAILS:z.string().default(''), ODOO_URL:z.string().optional(), ODOO_DB:z.string().optional(), ODOO_USERNAME:z.string().optional(), ODOO_API_KEY:z.string().optional(), HTTPSMS_API_KEY:z.string().optional(), HTTPSMS_FROM_NUMBER:z.string().optional(), CRON_SECRET:z.string().optional() });
export const env = schema.parse(process.env);
export function required(name:keyof typeof env):string { const value=env[name]; if(typeof value!=='string'||!value) throw new Error(`Missing required environment variable: ${name}`); return value; }
