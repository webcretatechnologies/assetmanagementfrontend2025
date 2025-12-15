import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET all categories (requires organizationId query param)
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get("organizationId");

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!organizationId) {
            return NextResponse.json(
                { message: "organizationId is required" },
                { status: 400 }
            );
        }

        // Forward all query parameters to the backend
        const page = searchParams.get("page");
        const limit = searchParams.get("limit");
        const search = searchParams.get("search");

        const backendParams = new URLSearchParams();
        backendParams.set("organizationId", organizationId);
        if (page) backendParams.set("page", page);
        if (limit) backendParams.set("limit", limit);
        if (search) backendParams.set("search", search);

        const response = await axios.get(`${API_BASE_URL}/categories?${backendParams.toString()}`, {
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
            { message: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// POST create category
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const response = await axios.post(`${API_BASE_URL}/categories`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return NextResponse.json(response.data, { status: 201 });
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return NextResponse.json(
                error.response.data,
                { status: error.response.status }
            );
        }
        return NextResponse.json(
            { message: "Failed to create category" },
            { status: 500 }
        );
    }
}
