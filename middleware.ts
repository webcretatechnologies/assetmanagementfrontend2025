import { NextRequest, NextResponse } from "next/server";

// Define protected routes
const protectedRoutes = ["/dashboard", "/assets", "/profile", "/organizations", "/branches", "/users", "/categories", "/inventory", "/assignments", "/requests", "/vendors", "/service-logs"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute) {
        // Check for access token cookie
        const token = request.cookies.get("access_token")?.value;

        if (!token) {
            // Redirect to login if no token
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect logged-in users away from login page
    if (pathname === "/login") {
        const token = request.cookies.get("access_token")?.value;
        if (token) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/assets/:path*",
        "/profile/:path*",
        "/organizations/:path*",
        "/branches/:path*",
        "/users/:path*",
        "/categories/:path*",
        "/inventory/:path*",
        "/assignments/:path*",
        "/requests/:path*",
        "/vendors/:path*",
        "/service-logs/:path*",
        "/login",
    ],
};
