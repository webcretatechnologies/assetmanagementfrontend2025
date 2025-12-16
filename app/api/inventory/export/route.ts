import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

// GET export inventory to Excel file
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

        // Forward to backend and get the file
        const response = await axios.get(`${API_BASE_URL}/inventory/export?${searchParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: "arraybuffer",
        });

        // Return the file with appropriate headers
        const headers = new Headers();
        headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        headers.set("Content-Disposition", 'attachment; filename="inventory_export.xlsx"');

        return new NextResponse(response.data, {
            status: 200,
            headers,
        });
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return NextResponse.json(
                error.response.data,
                { status: error.response.status }
            );
        }
        return NextResponse.json(
            { message: "Failed to export inventory" },
            { status: 500 }
        );
    }
}
