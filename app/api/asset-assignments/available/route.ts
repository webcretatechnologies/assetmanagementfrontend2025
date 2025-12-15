import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET available assets
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;
        const { searchParams } = new URL(request.url);

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const response = await axios.get(
            `${API_BASE_URL}/asset-assignments/available?${searchParams.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return NextResponse.json(error.response.data, { status: error.response.status });
        }
        return NextResponse.json({ message: "Failed to fetch available assets" }, { status: 500 });
    }
}
