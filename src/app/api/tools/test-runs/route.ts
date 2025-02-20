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
      return new NextResponse(JSON.stringify(createdRun), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
        console.error('Error creating test run:', String(error));
        return NextResponse.json({ error: 'Failed to create test run' }, { status: 500 });
    }
  }
  

  export async function PUT(request: Request) {
    try {
      const updatedRun = await request.json();
      const run = await dbService.updateTestRun(updatedRun);
      return new NextResponse(JSON.stringify(run), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error('Error updating test run:', error);
      return new NextResponse(JSON.stringify({ error: 'Failed to update test run' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }  
