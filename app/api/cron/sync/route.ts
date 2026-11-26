import { env } from '@/lib/env';import { syncInvoices } from '@/lib/sync';
export const maxDuration=60;
export async function GET(req:Request){if(!env.CRON_SECRET)return Response.json({error:'CRON_SECRET is not configured'},{status:503});if(req.headers.get('authorization')!==`Bearer ${env.CRON_SECRET}`)return Response.json({error:'Unauthorized'},{status:401});try{return Response.json(await syncInvoices({trigger:'cron'}));}catch(e){return Response.json({error:String(e)},{status:500});}}
