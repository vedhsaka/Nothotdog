// app/api/test-variations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dbService } from '@/services/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
  }

  try {
    const result = await dbService.getTestVariations(testId);
    // The result will be of the shape: { testId: string, testCases: [ { id, scenario, expectedOutput } ] }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching test variations:', error);
    return NextResponse.json({ error: 'Failed to fetch test variations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const { variation } = await request.json();
      const result = await dbService.createTestVariation(variation);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to create variation' }, { status: 500 });
    }
  }
  
  export async function PUT(request: Request) {
    try {
      const { variation } = await request.json();
      const result = await dbService.updateTestVariation(variation);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
    }
  }

  export async function DELETE(request: Request) {
    try {
      const { variation } = await request.json();
      const result = await dbService.deleteTestVariation(variation);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error deleting variation:', error);
      return NextResponse.json({ error: 'Failed to delete variation' }, { status: 500 });
    }
  }
  
  