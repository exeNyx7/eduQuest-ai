import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    const url = `${backendUrl}/api/study/files/${params.userId}`;
    
    console.log("[API] 🔍 Fetching scrolls from:", url);
    console.log("[API] User ID:", params.userId);
    console.log("[API] Backend URL from env:", process.env.NEXT_PUBLIC_BACKEND_URL);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Disable caching to always get fresh data
    });
    
    const data = await response.json();
    
    console.log("[API] Response status:", response.status);
    console.log("[API] Response data:", JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      console.error("[API] Backend error:", data);
      return NextResponse.json(
        { error: data.detail || "Failed to fetch scrolls" },
        { status: response.status }
      );
    }

    console.log("[API] Returning scrolls count:", data.scrolls?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching scrolls:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
