import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema';
let instance: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function db(){ if(!env.DATABASE_URL) throw new Error('DATABASE_URL is required'); return instance ??= drizzle(neon(env.DATABASE_URL),{schema}); }
