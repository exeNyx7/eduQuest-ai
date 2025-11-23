import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(
      `${backendUrl}/api/flashcards/${params.id}?user_id=${userId}`,
      { method: "DELETE" }
    );
    
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete flashcard" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard" },
      { status: 500 }
    );
  }
}
