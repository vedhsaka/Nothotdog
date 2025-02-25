import { NextResponse } from "next/server";
import { dbService } from "@/services/db/dbService";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const personas = await dbService.getPersonas(userId);
    return new NextResponse(
      JSON.stringify(personas),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching personas:", error);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}