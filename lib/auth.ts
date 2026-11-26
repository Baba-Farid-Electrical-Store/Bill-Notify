import { auth, currentUser } from '@clerk/nextjs/server';
import { env } from './env';
export function isAllowed(email?:string|null){ return !!email && env.ALLOWED_EMAILS.split(',').map(x=>x.trim().toLowerCase()).includes(email.toLowerCase()); }
export async function requireUser(){ const {userId}=auth(); if(!userId) throw new Error('Unauthorized'); const user=await currentUser(); const email=user?.emailAddresses.find(e=>e.id===user.primaryEmailAddressId)?.emailAddress; if(!isAllowed(email)) throw new Error('Forbidden'); return {userId,email:email!}; }
