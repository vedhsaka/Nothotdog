import { NextResponse } from 'next/server';
import { dbService } from '@/services/db/dbService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userProfile = await dbService.getProfileByClerkId(userId);
    if (!userProfile || !userProfile.org_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    
    if (id) {
      const config = await dbService.getAgentConfigAll(id);
      if (!config) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      if (config.org_id !== userProfile.org_id) {
        return NextResponse.json(
          { error: 'User does not have access to this Agent' },
          { status: 403 }
        );
      }
      return NextResponse.json(config);
    }


    
    const configs = await dbService.getAgentConfigs(userId);
    const lightConfigs = configs.map((cfg: any) => ({ id: cfg.id, name: cfg.name }));
    return NextResponse.json(lightConfigs);
    
  } catch (error) {
    console.error('Error fetching agent configs:', error);

  }
}


export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const configData = await request.json();
    const userProfile = await dbService.getProfileByClerkId(userId);
    if (!userProfile || !userProfile.org_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    if (configData.org_id !== userProfile.org_id) {
      return NextResponse.json({ error: 'User does not have access to this organization' }, { status: 403 });
    }
    const result = await dbService.saveAgentConfig(configData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving agent config:', error);
    return NextResponse.json({ error: 'Failed to save agent config' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
  const configData = await request.json();
  if (!configData.id) {
    return NextResponse.json({ error: 'Config ID is required' }, { status: 400 });
  }
  const userProfile = await dbService.getProfileByClerkId(userId);
  if (!userProfile || !userProfile.org_id) {
    return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
  }
  if (configData.org_id !== userProfile.org_id) {
    return NextResponse.json({ error: 'User does not have access to this organization' }, { status: 403 });
  }
  const result = await dbService.saveAgentConfig(configData);
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { configId, org_id } = await request.json();
    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 });
    }
    const userProfile = await dbService.getProfileByClerkId(userId);
    if (!userProfile || !userProfile.org_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }
    if (org_id !== userProfile.org_id) {
      return NextResponse.json({ error: 'User does not have access to this organization' }, { status: 403 });
    }    
    const result = await dbService.deleteAgentConfig(configId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting agent config:', error);
    return NextResponse.json({ error: 'Failed to delete agent config' }, { status: 500 });
  }
}


