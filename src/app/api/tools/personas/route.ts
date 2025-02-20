import { NextResponse } from 'next/server';
import { dbService } from '@/services/db';

export async function GET(req: Request) {
  try {
    const personas = await dbService.getPersonas();
    return NextResponse.json(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json({ error: 'Error fetching personas' }, { status: 500 });
  }
}
