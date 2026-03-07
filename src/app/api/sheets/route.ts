import { NextRequest, NextResponse } from 'next/server';
import { sheetsGet, sheetsAppend, sheetsUpdate } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, range, values } = body;

    switch (action) {
      case 'get': {
        const data = await sheetsGet(range);
        return NextResponse.json(data);
      }
      case 'append': {
        const data = await sheetsAppend(range, values);
        return NextResponse.json(data);
      }
      case 'update': {
        const data = await sheetsUpdate(range, values);
        return NextResponse.json(data);
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
