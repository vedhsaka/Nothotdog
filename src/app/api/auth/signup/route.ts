import { NextResponse } from "next/server";
import { dbService } from "@/services/db/dbService";

export async function POST(request: Request) {
  try {
    const { clerkId, orgName, orgDescription, role, status } = await request.json();
    const result = await dbService.signupUser({
      clerkId,
      orgName,
      orgDescription,
      role,
      status,
    });
    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error during signup:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to sign up user" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
