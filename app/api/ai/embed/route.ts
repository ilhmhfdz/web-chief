import { NextResponse } from 'next/server';
import { storePDFKnowledge } from '@/lib/ai/embeddings';
import { KnowledgeBase } from '@/lib/db/models/KnowledgeBase';
import dbConnect from '@/lib/db/mongoose';

// ---- POST /api/ai/embed ----
// Accepts: multipart/form-data with a "file" field (plain text or .txt)
// For true PDF parsing, add a PDF parser library (e.g. pdf-parse) later.
// For now, we accept plain text body to keep the backend dependency-free.
export async function POST(req: Request) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = ['text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only .txt and .pdf files are supported' },
        { status: 415 }
      );
    }

    // Read file content based on type
    let rawText = '';
    if (file.type === 'application/pdf') {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      rawText = parsed.text;
    } else {
      rawText = await file.text();
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const source = file.name;

    // Remove existing chunks for this source before re-embedding (idempotent)
    await KnowledgeBase.deleteMany({ 'metadata.source': source });

    // Chunk, embed, and store
    await storePDFKnowledge(rawText, source);

    const chunkCount = await KnowledgeBase.countDocuments({ 'metadata.source': source });

    return NextResponse.json({
      message: `Successfully embedded "${source}"`,
      source,
      chunkCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---- GET /api/ai/embed — list all embedded sources ----
export async function GET() {
  try {
    await dbConnect();

    const sources = await KnowledgeBase.aggregate([
      {
        $group: {
          _id: '$metadata.source',
          chunkCount: { $sum: 1 },
          createdAt: { $max: '$createdAt' },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 0,
          source: '$_id',
          chunkCount: 1,
          createdAt: 1,
        },
      },
    ]);

    return NextResponse.json({ data: sources });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---- DELETE /api/ai/embed — delete a source by name ----
export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const { source } = await req.json();
    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    const result = await KnowledgeBase.deleteMany({ 'metadata.source': source });

    return NextResponse.json({
      message: `Deleted "${source}" (${result.deletedCount} chunks)`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
