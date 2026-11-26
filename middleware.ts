import { clerkMiddleware,createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
const publicRoute=createRouteMatcher(['/api/health','/api/cron/(.*)','/sign-in(.*)']);
export default clerkMiddleware((auth,req)=>{if(!publicRoute(req))auth().protect();return NextResponse.next();});
export const config={matcher:['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|woff2?|ttf|webmanifest)).*)','/(api)(.*)']};
