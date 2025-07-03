import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login";

  // Check if there's an access token in cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const hasToken = !!accessToken;

  // If the path is public and we have a token, redirect to dashboard
  if (isPublicPath && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the path is protected and we don't have a token, redirect to login
  if (!isPublicPath && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
