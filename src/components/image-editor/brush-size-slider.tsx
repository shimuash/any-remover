'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from './hooks/use-editor-state';
import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from './types';

export default function BrushSizeSlider() {
  const t = useTranslations('ImageEditor');

  const {
    activeTool,
    brushSize,
    setBrushSize,
    clearLines,
    isProcessing,
    isCompareMode,
    hasMask,
  } = useEditorStore();

  // Only show when brush or eraser is active, and not in compare mode
  if (isCompareMode || activeTool === 'chat') {
    return null;
  }

  const canClear = hasMask() && !isProcessing;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-4 bg-muted/30 rounded-lg p-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {t('brushSize')}
        </span>

        <Slider
          value={[brushSize]}
          onValueChange={([value]) => setBrushSize(value)}
          min={MIN_BRUSH_SIZE}
          max={MAX_BRUSH_SIZE}
          step={1}
          disabled={isProcessing}
          className="flex-1"
        />

        <span className="text-sm text-muted-foreground w-8 text-right">
          {brushSize}
        </span>

        {/* Clear mask button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={clearLines}
          disabled={!canClear}
          aria-label={t('tools.clearMask')}
          title={t('tools.clearMask')}
          className="ml-2"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
