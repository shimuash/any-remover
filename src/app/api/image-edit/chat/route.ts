import { requireSession, unauthorizedResponse } from '@/lib/require-session';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { image, prompt } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: image is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Invalid request: prompt is required' },
        { status: 400 }
      );
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // Mock implementation: simulate processing delay
    // TODO: Integrate with actual image editing AI service
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For mock, return the original image
    // In production, this would call an AI image editing service
    // (like DALL-E edit, Stable Diffusion instruction-following, etc.)
    // and return the processed result
    return NextResponse.json({ image });
  } catch (error) {
    console.error('Chat edit API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
