import { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.50:3000/api";

export async function GET(request: NextRequest) {
    // Check query parameter first, then fallback to cookies
    const queryToken = request.nextUrl.searchParams.get("token");
    const cookieToken = request.cookies.get("access_token")?.value;
    const token = queryToken || cookieToken;

    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Create a TransformStream to pass data through
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Pass token via query parameter as backend expects it there
                const response = await fetch(`${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "text/event-stream",
                    },
                });

                if (!response.ok) {
                    controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Backend connection failed" })}\n\n`));
                    controller.close();
                    return;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                // Read from backend and forward to client
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.close();
                        break;
                    }
                    controller.enqueue(value);
                }
            } catch (error) {
                console.error("SSE Proxy Error:", error);
                controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Connection failed" })}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

// Disable body parsing for streaming
export const dynamic = "force-dynamic";
