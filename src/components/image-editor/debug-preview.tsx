'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from './hooks/use-editor-state';
import { generateCompositeImage, loadImage } from './lib/image-compositor';

export default function DebugPreview() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  const { currentImage, lines, debugMode, isCompareMode } = useEditorStore();

  // Update preview with throttling
  useEffect(() => {
    if (!debugMode || !currentImage || isCompareMode) {
      setPreviewSrc(null);
      return;
    }

    // Clear previous timeout
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    // Throttle updates (100ms for desktop)
    throttleRef.current = setTimeout(async () => {
      try {
        const img = await loadImage(currentImage);
        const composite = generateCompositeImage(img, lines);
        setPreviewSrc(composite);
      } catch (error) {
        console.error('Debug preview error:', error);
      }
    }, 100);

    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [currentImage, lines, debugMode, isCompareMode]);

  if (!debugMode || !previewSrc || isCompareMode) {
    return null;
  }

  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm overflow-hidden">
      <div className="p-1 text-[10px] text-muted-foreground text-center border-b">
        Preview
      </div>
      <div className="w-100 h-100 overflow-hidden">
        <img
          src={previewSrc}
          alt="Debug preview"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
