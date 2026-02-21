import { NextRequest, NextResponse } from 'next/server';
import { nodewhisper } from 'nodejs-whisper';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio') as File;

  const buffer = Buffer.from(await audio.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `recording-${Date.now()}.wav`);

  await writeFile(tmpPath, buffer);

  const result = await nodewhisper(tmpPath, {
    modelName: 'tiny.en',
    autoDownloadModelName: 'tiny.en',
  });

  await unlink(tmpPath);

  return NextResponse.json({ text: result });
}