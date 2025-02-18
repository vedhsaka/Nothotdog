import { NextResponse } from "next/server";
import { dbService } from "@/services/db";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
  
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }
  
    try {
      const config = await dbService.getAgentConfigAll(agentId);
      if (!config) {
        return NextResponse.json({ error: "Config not found" }, { status: 404 });
      }
      return NextResponse.json(config.rules);
    } catch (error) {
      console.error("Failed to fetch rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }
  }

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { agentId, rules } = data;

    if (!agentId || !rules) {
      return NextResponse.json(
        { error: "Agent ID and rules are required" },
        { status: 400 }
      );
    }

    await dbService.saveAgentConfig({
      id: agentId,
      rules: rules
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save rules:", error);
    return NextResponse.json(
      { error: "Failed to save rules" },
      { status: 500 }
    );
  }
}