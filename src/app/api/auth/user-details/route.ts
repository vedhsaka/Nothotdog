import { NextResponse } from "next/server";
import { dbService } from "@/services/db/dbService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clerkId = searchParams.get("clerkId");
  if (!clerkId) {
    return new NextResponse(
      JSON.stringify({ error: "Clerk ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const profile = await dbService.getProfileByClerkId(clerkId);
    if (!profile || !profile.org_id) {
      return new NextResponse(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const organization = await dbService.getOrganization(profile.org_id);
    return new NextResponse(
      JSON.stringify({ profile, organization }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error loading user details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to load user details" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
