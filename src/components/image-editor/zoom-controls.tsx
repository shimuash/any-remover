'use client';

import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from './hooks/use-editor-state';

export default function ZoomControls() {
  const t = useTranslations('ImageEditor');

  const { zoomLevel, zoomIn, zoomOut, toggleZoomReset, isCompareMode } =
    useEditorStore();

  if (isCompareMode) {
    return null;
  }

  // Format zoom percentage
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className="flex flex-col gap-1 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
      {/* Zoom in */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={zoomIn}
        aria-label={t('zoom.zoomIn')}
        title={t('zoom.zoomIn')}
        className="rounded-b-none"
      >
        <Plus className="size-4" />
      </Button>

      {/* Zoom percentage - click to reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleZoomReset}
        aria-label={t('zoom.resetZoom')}
        title={t('zoom.resetZoom')}
        className="rounded-none px-2 min-w-[50px] text-xs font-mono"
      >
        {zoomPercent}%
      </Button>

      {/* Zoom out */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={zoomOut}
        aria-label={t('zoom.zoomOut')}
        title={t('zoom.zoomOut')}
        className="rounded-t-none"
      >
        <Minus className="size-4" />
      </Button>
    </div>
  );
}
