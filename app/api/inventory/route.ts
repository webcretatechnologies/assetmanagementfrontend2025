import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET inventory list
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;
        const { searchParams } = new URL(request.url);

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const organizationId = searchParams.get("organizationId");
        if (!organizationId) {
            return NextResponse.json(
                { message: "organizationId is required" },
                { status: 400 }
            );
        }

        const response = await axios.get(`${API_BASE_URL}/inventory?${searchParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
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
            { message: "Failed to fetch inventory" },
            { status: 500 }
        );
    }
}
