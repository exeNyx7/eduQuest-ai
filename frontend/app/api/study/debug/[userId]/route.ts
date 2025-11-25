import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const url = `${backendUrl}/api/study/debug/${params.userId}`;
    
    console.log("[DEBUG] Fetching debug info from:", url);

    const response = await fetch(url);
    const data = await response.json();
    
    console.log("[DEBUG] Response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[DEBUG] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}