import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }
  const mapping = await dbService.getPersonaMappingByAgentId(agentId);
  return NextResponse.json(mapping);
}

export async function POST(req: Request) {
    const { agentId, personaId } = await req.json();
    if (!agentId || !personaId) {
      return NextResponse.json({ error: 'agentId and personaId required' }, { status: 400 });
    }
    const mapping = await dbService.createPersonaMapping(agentId, personaId);
    return NextResponse.json(mapping || { personaIds: [] });
  }
  
  
  export async function DELETE(req: Request) {
    const { agentId, personaId } = await req.json();
    if (!agentId || !personaId) {
      return NextResponse.json({ error: 'agentId and personaId required' }, { status: 400 });
    }
    const mapping = await dbService.deletePersonaMapping(agentId, personaId);
    return NextResponse.json(mapping);
  }
  