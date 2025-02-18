import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';

export async function GET(request: Request) {
  try {
    const testRuns = await dbService.getTestRuns();
    return NextResponse.json(testRuns);
  } catch (error: any) {
    console.error('Error fetching test runs:', error);
    return NextResponse.json({ error: 'Failed to fetch test runs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newRun = await request.json();
    const createdRun = await dbService.createTestRun(newRun);
    return NextResponse.json(createdRun);
  } catch (error: any) {
    console.error('Error creating test run:', error);
    return NextResponse.json({ error: 'Failed to create test run' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedRun = await request.json();
    const run = await dbService.updateTestRun(updatedRun);
    return NextResponse.json(run);
  } catch (error: any) {
    console.error('Error updating test run:', error);
    return NextResponse.json({ error: 'Failed to update test run' }, { status: 500 });
  }
}
