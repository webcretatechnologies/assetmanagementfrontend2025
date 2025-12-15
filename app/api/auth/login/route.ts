import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Call the backend API
        const data = await login(email, password);

        // Create response with user data
        const response = NextResponse.json({
            user: data.user,
            access_token: data.access_token,
        });

        // Set HTTP-only cookie with the access token
        response.cookies.set({
            name: "access_token",
            value: data.access_token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message || "Login failed" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { message: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
