import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    
    let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/flashcards/all/${params.userId}`;
    if (status) {
      url += `?status=${status}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch flashcards" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
