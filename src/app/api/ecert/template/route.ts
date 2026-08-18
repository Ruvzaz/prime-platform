import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Check multiple potential asset locations
    const locations = [
      path.join(process.cwd(), 'assets', 'Template.png'),
      path.join(process.cwd(), 'public', 'Template.png'),
      path.join(process.cwd(), 'public', 'templates', 'Template.png'),
    ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        const imageBuffer = fs.readFileSync(loc);
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400, immutable',
          },
        });
      }
    }

    return new NextResponse('Template image file not found on server', { status: 404 });
  } catch (error) {
    console.error("Template Route Error:", error);
    return new NextResponse('Error loading certificate template', { status: 500 });
  }
}
