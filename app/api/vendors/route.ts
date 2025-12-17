import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET all vendors
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Forward query parameters to backend
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const url = queryString ? `${API_BASE_URL}/vendors?${queryString}` : `${API_BASE_URL}/vendors`;

        const response = await axios.get(url, {
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
            { message: "Failed to fetch vendors" },
            { status: 500 }
        );
    }
}

// POST create vendor
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

        const response = await axios.post(`${API_BASE_URL}/vendors`, body, {
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
            { message: "Failed to create vendor" },
            { status: 500 }
        );
    }
}
