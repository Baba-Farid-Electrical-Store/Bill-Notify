import { requireUser } from '@/lib/auth';import { syncInvoices } from '@/lib/sync';
export const maxDuration=60;
export async function POST(){try{await requireUser();return Response.json(await syncInvoices({trigger:'manual'}));}catch(e){return Response.json({error:String(e)},{status:401});}}
