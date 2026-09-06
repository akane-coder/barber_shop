import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const cachePath = path.join(process.cwd(), 'data', 'parsed-statuses.json');
    const data = await fs.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(data);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ statuses: {}, timestamp: null, errors: [] });
  }
}