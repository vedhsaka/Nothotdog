import { NextResponse } from 'next/server';
import { dbService } from '@/services/db/dbService';

export async function GET(request: Request) {
  try {
    const configs = await dbService.getAgentConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching agent configs:', error);
    return NextResponse.json({ error: 'Failed to fetch agent configs' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { configId } = await request.json();
    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 });
    }
    // Delete the agent config along with its associated scenarios and persona mappings
    const result = await dbService.deleteAgentConfig(configId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting agent config:', error);
    return NextResponse.json({ error: 'Failed to delete agent config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const configData = await request.json();
    const result = await dbService.saveAgentConfig(configData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving agent config:', error);
    return NextResponse.json({ error: 'Failed to save agent config' }, { status: 500 });
  }
}
