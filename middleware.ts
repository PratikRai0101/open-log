import { clerkMiddleware } from "@clerk/nextjs/server";

// Use Clerk middleware to populate auth state for server-side helpers (auth(), getAuth(), etc.)
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run middleware for API routes
    '/(api|trpc)(.*)',
  ],
};
