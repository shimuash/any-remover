import {
  BRUSH_COLOR,
  BRUSH_OPACITY,
  type Line,
  MAX_IMAGE_SIZE,
} from '../types';

export function updateMaskCanvas(
  canvas: HTMLCanvasElement,
  lines: Line[],
  size: { width: number; height: number }
): void {
  const { width, height } = size;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const line of lines) {
    const points = line.points;
    if (points.length < 2) continue;

    ctx.lineWidth = line.strokeWidth;
    ctx.globalAlpha = 1;

    if (line.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = BRUSH_COLOR;
    }

    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      ctx.lineTo(points[i], points[i + 1]);
    }
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Track last drawn state for incremental updates
let lastDrawnLineIndex = 0;
let lastDrawnPointCount = 0;

/**
 * Reset incremental drawing state (call when lines are cleared)
 */
export function resetMaskCanvasState(): void {
  lastDrawnLineIndex = 0;
  lastDrawnPointCount = 0;
}

/**
 * Incremental mask canvas update - only draws new segments
 * Falls back to full redraw when eraser is detected
 */
export function updateMaskCanvasIncremental(
  canvas: HTMLCanvasElement,
  lines: Line[],
  size: { width: number; height: number }
): void {
  const { width, height } = size;

  // Reset state if canvas size changes
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    resetMaskCanvasState();
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // If no lines, clear and reset
  if (lines.length === 0) {
    ctx.clearRect(0, 0, width, height);
    resetMaskCanvasState();
    return;
  }

  // Check if any new line uses eraser (requires full redraw)
  const hasNewEraser = lines.slice(lastDrawnLineIndex).some((l) => l.isEraser);
  if (hasNewEraser) {
    updateMaskCanvas(canvas, lines, size);
    lastDrawnLineIndex = lines.length;
    lastDrawnPointCount = lines[lines.length - 1]?.points.length || 0;
    return;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Draw only new content
  for (let i = lastDrawnLineIndex; i < lines.length; i++) {
    const line = lines[i];
    const points = line.points;
    if (points.length < 2) continue;

    // For the last tracked line, only draw new points
    const startIdx =
      i === lastDrawnLineIndex ? Math.max(0, lastDrawnPointCount - 2) : 0;
    if (startIdx >= points.length - 2) continue;

    ctx.lineWidth = line.strokeWidth;
    ctx.strokeStyle = BRUSH_COLOR;

    ctx.beginPath();
    ctx.moveTo(points[startIdx], points[startIdx + 1]);
    for (let j = startIdx + 2; j < points.length; j += 2) {
      ctx.lineTo(points[j], points[j + 1]);
    }
    ctx.stroke();
  }

  // Update tracking state
  if (lines.length > 0) {
    lastDrawnLineIndex = lines.length - 1;
    lastDrawnPointCount = lines[lines.length - 1].points.length;
  }
}

/**
 * Generate a composite image by overlaying mask lines on the current image.
 * This creates the image that will be sent to the backend for inpainting.
 *
 * CRITICAL: Uses a separate maskCanvas to handle eraser strokes correctly.
 * Eraser uses destination-out which would erase the base image if drawn directly.
 */
export function generateCompositeImage(
  currentImage: HTMLImageElement,
  lines: Line[]
): string {
  const width = currentImage.naturalWidth;
  const height = currentImage.naturalHeight;

  // 1. Create mask canvas (transparent background)
  const maskCanvas = document.createElement('canvas');
  updateMaskCanvas(maskCanvas, lines, { width, height });

  // 3. Create final canvas, composite base image + mask
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d')!;

  // Draw base image
  finalCtx.drawImage(currentImage, 0, 0);

  // Overlay mask
  finalCtx.globalAlpha = BRUSH_OPACITY;
  finalCtx.drawImage(maskCanvas, 0, 0);
  finalCtx.globalAlpha = 1;

  return finalCanvas.toDataURL('image/png');
}

/**
 * Detect image format from base64 data URL
 */
export function detectImageFormat(base64: string): 'jpeg' | 'png' | 'webp' {
  if (
    base64.startsWith('data:image/jpeg') ||
    base64.startsWith('data:image/jpg')
  ) {
    return 'jpeg';
  }
  if (base64.startsWith('data:image/webp')) {
    return 'webp';
  }
  return 'png'; // Default to PNG
}

/**
 * Get file extension from format
 */
export function getExtension(format: 'jpeg' | 'png' | 'webp'): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/**
 * Download an image
 */
export function downloadImage(base64: string, originalFormat?: string): void {
  const format = originalFormat
    ? (originalFormat as 'jpeg' | 'png' | 'webp')
    : detectImageFormat(base64);
  const ext = getExtension(format);
  const filename = `edited_${Date.now()}.${ext}`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = base64;
  link.click();
}

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Load an image from a base64 string
 */
export function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image if it exceeds max dimensions
 */
export async function resizeImageIfNeeded(
  base64: string,
  maxSize: number = MAX_IMAGE_SIZE
): Promise<string> {
  const img = await loadImage(base64);

  // Check if resizing is needed
  if (img.naturalWidth <= maxSize && img.naturalHeight <= maxSize) {
    return base64;
  }

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = img.naturalWidth;
  let newHeight = img.naturalHeight;

  if (newWidth > newHeight) {
    if (newWidth > maxSize) {
      newHeight = Math.round((newHeight * maxSize) / newWidth);
      newWidth = maxSize;
    }
  } else {
    if (newHeight > maxSize) {
      newWidth = Math.round((newWidth * maxSize) / newHeight);
      newHeight = maxSize;
    }
  }

  // Create canvas and resize
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Preserve original format if possible
  const format = detectImageFormat(base64);
  const mimeType =
    format === 'jpeg'
      ? 'image/jpeg'
      : format === 'webp'
        ? 'image/webp'
        : 'image/png';
  const quality = format === 'png' ? undefined : 0.92;

  return canvas.toDataURL(mimeType, quality);
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'unsupportedFormat' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'fileTooLarge' };
  }

  return { valid: true };
}

/**
 * Get image dimensions from base64
 */
export async function getImageDimensions(
  base64: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(base64);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}
