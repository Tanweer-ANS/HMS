// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/api/appointments(.*)'])

export default clerkMiddleware(async(auth , req)=>{
    if (isProtectedRoute(req)) await auth.protect()
});

export const config = {
  // Use a regex to match all routes except static files and _next
  matcher: ['/((?!.*\\..*|_next).*)', '/'],
};