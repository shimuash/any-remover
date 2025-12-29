'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from './hooks/use-editor-state';
import type { ViewportInsets } from './types';

interface CompareViewProps {
  viewportInsets?: ViewportInsets;
}

const DEFAULT_VIEWPORT_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export default function CompareView({ viewportInsets }: CompareViewProps) {
  const t = useTranslations('ImageEditor');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    originalImage,
    currentImage,
    isCompareMode,
    comparePosition,
    setComparePosition,
  } = useEditorStore();

  // Handle slider drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

      setComparePosition(percentage);
    },
    [isDragging, setComparePosition]
  );

  // Global mouse/touch events for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalTouchMove = (e: TouchEvent) => handleMouseMove(e);

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isCompareMode || !originalImage || !currentImage) {
    return null;
  }

  const safeInsets = viewportInsets ?? DEFAULT_VIEWPORT_INSETS;

  return (
    <div
      ref={containerRef}
      className="absolute overflow-hidden select-none"
      style={{
        top: safeInsets.top,
        right: safeInsets.right,
        bottom: safeInsets.bottom,
        left: safeInsets.left,
      }}
    >
      {/* Original image (left side) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}
      >
        <img
          src={originalImage}
          alt={t('compare.original')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain"
          draggable={false}
        />
        {/* Original label */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {t('compare.original')}
        </div>
      </div>

      {/* Current image (right side) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${comparePosition}%)` }}
      >
        <img
          src={currentImage}
          alt={t('compare.current')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full object-contain"
          draggable={false}
        />
        {/* Current label */}
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {t('compare.current')}
        </div>
      </div>

      {/* Slider */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
        style={{ left: `${comparePosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Slider handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-gray-400 rounded" />
            <div className="w-0.5 h-4 bg-gray-400 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
