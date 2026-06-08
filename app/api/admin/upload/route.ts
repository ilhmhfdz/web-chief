import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ============================================================
// POST /api/admin/upload — Upload an image
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    // TODO: Vercel Blob Integration
    // If you use Vercel Blob, you would do something like:
    // import { put } from '@vercel/blob';
    // const blob = await put(filename, file, { access: 'public' });
    // return NextResponse.json({ url: blob.url });

    // Local Storage Fallback (for development)
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure the directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Ignore if directory already exists
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat mengunggah.' }, { status: 500 });
  }
}
