import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { email } = await req.json();
    const result = await dbService.createUserWithOrganization(userId, email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}