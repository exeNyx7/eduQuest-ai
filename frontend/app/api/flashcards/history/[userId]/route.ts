import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "100";

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/api/flashcards/history/${params.userId}?limit=${limit}`
    );
    
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
