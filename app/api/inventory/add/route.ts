import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// POST add inventory (supports JSON and multipart/form-data for invoice)
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const contentType = request.headers.get("content-type") || "";

        // Handle multipart/form-data (with invoice file)
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();

            const response = await axios.post(`${API_BASE_URL}/inventory/add`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            return NextResponse.json(response.data, { status: 201 });
        }

        // Handle JSON (without invoice file)
        const body = await request.json();

        const response = await axios.post(`${API_BASE_URL}/inventory/add`, body, {
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
            { message: "Failed to add inventory" },
            { status: 500 }
        );
    }
}

