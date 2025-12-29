'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import { cn } from '@/lib/utils';
import {
  Brush,
  BrushCleaning,
  ChevronDown,
  Eraser,
  ImageUpscale,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ChatPanel from './chat-panel';
import { useEditorStoreSelector } from './hooks/use-editor-state';
import { RemoveButton } from './remove-button';
import { type EditorTool, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from './types';

interface EditorToolbarProps {
  className?: string;
}

export default function EditorToolbar({ className }: EditorToolbarProps) {
  const t = useTranslations('ImageEditor');

  const {
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    clearLines,
    isProcessing,
    isCompareMode,
    isEraserMode,
    setEraserMode,
    hasMask,
    isPointerOnImage,
    setBrushSizeAdjusting,
  } = useEditorStoreSelector((s) => ({
    activeTool: s.activeTool,
    setActiveTool: s.setActiveTool,
    brushSize: s.brushSize,
    setBrushSize: s.setBrushSize,
    clearLines: s.clearLines,
    isProcessing: s.isProcessing,
    isCompareMode: s.isCompareMode,
    isEraserMode: s.isEraserMode,
    setEraserMode: s.setEraserMode,
    hasMask: s.hasMask,
    isPointerOnImage: s.isPointerOnImage,
    setBrushSizeAdjusting: s.setBrushSizeAdjusting,
  }));

  // Popover state for brush size panel
  const [brushPopoverOpen, setBrushPopoverOpen] = useState(false);

  // Handle popover close: reset eraser mode
  const handlePopoverOpenChange = (open: boolean) => {
    if (!open && isEraserMode) {
      setEraserMode(false);
    }
    setBrushPopoverOpen(open);
  };

  // Handle tool change: clear lines when switching to chat mode
  const handleToolChange = (value: string) => {
    if (!value) return;
    const tool = value as EditorTool;
    if (tool === 'chat') {
      clearLines();
    }
    setActiveTool(tool);
  };

  if (isCompareMode) {
    return null;
  }

  const canClear = hasMask() && !isProcessing;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Chat input above toolbar when chat tool is active */}
      <ChatPanel />

      <Toolbar size="sm">
        <ToolbarToggleGroup
          type="single"
          value={isEraserMode && activeTool === 'brush' ? '' : activeTool}
          onValueChange={handleToolChange}
        >
          <ToolbarToggleItem
            value="brush"
            disabled={isProcessing}
            aria-label={t('tools.brush')}
          >
            <Brush className="size-4" />
            {t('tools.brush')}
          </ToolbarToggleItem>
          <Popover
            open={brushPopoverOpen}
            onOpenChange={handlePopoverOpenChange}
          >
            <PopoverTrigger asChild>
              <ToolbarButton
                variant="secondary"
                size="sm"
                className="min-w-10 text-xs font-medium"
                disabled={isProcessing}
              >
                {brushSize}px
                <ChevronDown className="h-4 w-4 shrink-0" />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={16}
              className="w-64"
              onInteractOutside={(e) => {
                // Only prevent closing when eraser mode is active AND pointer is on image
                if (isEraserMode && isPointerOnImage) {
                  e.preventDefault();
                }
              }}
            >
              <div className="space-y-4">
                {/* Brush Size Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t('brushSize')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {brushSize}px
                    </span>
                  </div>
                  <Slider
                    value={[brushSize]}
                    onValueChange={([value]) => setBrushSize(value)}
                    onPointerDown={() => setBrushSizeAdjusting(true)}
                    onPointerUp={() => setBrushSizeAdjusting(false)}
                    onPointerLeave={() => setBrushSizeAdjusting(false)}
                    min={MIN_BRUSH_SIZE}
                    max={MAX_BRUSH_SIZE}
                    step={1}
                    disabled={isProcessing}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Toggle
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    pressed={isEraserMode}
                    onPressedChange={setEraserMode}
                    disabled={isProcessing}
                  >
                    <Eraser className="size-4 mr-1.5" />
                    {t('tools.eraser')}
                  </Toggle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={clearLines}
                    disabled={!canClear}
                  >
                    <BrushCleaning className="size-4 mr-1.5" />
                    {t('tools.clearMask')}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <ToolbarSeparator />

          <ToolbarToggleItem
            value="chat"
            disabled={isProcessing}
            aria-label={t('tools.chat')}
          >
            <WandSparkles className="size-4" />
            {t('tools.chat')}
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton
          variant={'ghost'}
          value="upscale"
          disabled={isProcessing}
          size="sm"
          onClick={clearLines}
        >
          <ImageUpscale className="size-4" />
          Upscale
        </ToolbarButton>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon-sm"
              className="text-xs focus-visible:outline-none"
              disabled={isCompareMode}
            >
              4K{/* <ChevronDown className="h-4 w-4 shrink-0" /> */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={16}
            className="min-w-14"
          >
            <DropdownMenuItem>2K</DropdownMenuItem>
            <DropdownMenuItem>4K</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarSeparator />
        <ToolbarButton asChild>
          <RemoveButton />
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
