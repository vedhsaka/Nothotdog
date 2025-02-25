// api/tools/persona-mapping/route.ts
import { NextResponse } from "next/server";
import { dbService } from "@/services/db/dbService";
import { auth } from "@clerk/nextjs/server"

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  
  if (!agentId) {
    return new NextResponse(
      JSON.stringify({ error: "Agent ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const mapping = await dbService.getPersonaMappingByAgentId(agentId);
    return new NextResponse(
      JSON.stringify(mapping),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching persona mapping:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch persona mapping" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const body = await request.json();
    const { agentId, personaId } = body;
    
    if (!agentId || !personaId) {
      return new NextResponse(
        JSON.stringify({ error: "Agent ID and Persona ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const result = await dbService.createPersonaMapping(agentId, personaId);
    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating persona mapping:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create persona mapping" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const body = await request.json();
    const { agentId, personaId } = body;
    
    if (!agentId || !personaId) {
      return new NextResponse(
        JSON.stringify({ error: "Agent ID and Persona ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const result = await dbService.deletePersonaMapping(agentId, personaId);
    return new NextResponse(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting persona mapping:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete persona mapping" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}