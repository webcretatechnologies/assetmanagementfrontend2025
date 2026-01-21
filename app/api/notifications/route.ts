import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET user notifications
export async function GET(request: NextRequest) {
    try {
        // Check multiple sources for token: query param, Authorization header, cookies
        const queryToken = request.nextUrl.searchParams.get("token");
        const authHeader = request.headers.get("Authorization");
        const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
        const cookieToken = request.cookies.get("access_token")?.value;
        const token = queryToken || headerToken || cookieToken;

        const { searchParams } = new URL(request.url);

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const limit = searchParams.get("limit") || "50";
        const includeRead = searchParams.get("includeRead") || "false";

        const response = await axios.get(`${API_BASE_URL}/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            params: { limit, includeRead },
        });

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return NextResponse.json(
                error.response.data,
                { status: error.response.status }
            );
        }
        return NextResponse.json(
            { message: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}
