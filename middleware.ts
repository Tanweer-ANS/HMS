import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

 
export default clerkMiddleware({
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};