'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Eraser,
  ImageUpscale,
  WandSparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMeasure } from 'react-use';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
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
    setBrushSizeAdjusting: s.setBrushSizeAdjusting,
  }));

  const [toolbarRef, { width: toolbarWidth }] = useMeasure<HTMLDivElement>();

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
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 w-fit',
        className
      )}
    >
      {/* Brush size panel above toolbar when brush tool is active */}
      {activeTool === 'brush' && (
        <>
          <div className="flex self-start px-1 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="cursor-pointer"
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 21v-4a4 4 0 1 1 4 4h-4" />
                    <path d="M21 3a16 16 0 0 0 -12.8 10.2" />
                    <path d="M21 3a16 16 0 0 1 -10.2 12.8" />
                    <path d="M10.6 9a9 9 0 0 1 4.4 4.4" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('tools.paint')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="cursor-pointer"
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 17a4 4 0 1 1 4 4h-4v-4" />
                    <path d="M21 3a16 16 0 0 0 -9.309 4.704m-1.795 2.212a15.993 15.993 0 0 0 -1.696 3.284" />
                    <path d="M21 3a16 16 0 0 1 -4.697 9.302m-2.195 1.786a15.993 15.993 0 0 1 -3.308 1.712" />
                    <path d="M3 3l18 18" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('tools.eraser')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={clearLines}
                >
                  <BrushCleaning />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('tools.clearMask')}</TooltipContent>
            </Tooltip>
          </div>
          <div className="w-full bg-background rounded-xl p-3 space-y-3 max-w-md self-start shadow-lg pb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('brushSize')}</span>
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
        </>
      )}

      {/* Chat input above toolbar when chat tool is active */}
      {/* Add 20px to compensate for Toolbar's px-2.5 padding (useMeasure returns content-box width) */}
      <ChatPanel maxWidth={toolbarWidth + 24} />

      <Toolbar ref={toolbarRef} size="sm" className="h-12 rounded-xl px-3">
        <ToolbarToggleGroup
          type="single"
          value={isEraserMode && activeTool === 'brush' ? '' : activeTool}
          onValueChange={handleToolChange}
        >
          <ToolbarToggleItem
            value="brush"
            disabled={isProcessing}
            aria-label={t('tools.brush')}
            className="cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mt-0.5 -mr-0.5"
            >
              <path d="M4.7134 7.12811L4.46682 7.69379C4.28637 8.10792 3.71357 8.10792 3.53312 7.69379L3.28656 7.12811C2.84706 6.11947 2.05545 5.31641 1.06767 4.87708L0.308047 4.53922C-0.102682 4.35653 -0.102682 3.75881 0.308047 3.57612L1.0252 3.25714C2.03838 2.80651 2.84417 1.97373 3.27612 0.930828L3.52932 0.319534C3.70578 -0.106511 4.29417 -0.106511 4.47063 0.319534L4.72382 0.930828C5.15577 1.97373 5.96158 2.80651 6.9748 3.25714L7.69188 3.57612C8.10271 3.75881 8.10271 4.35653 7.69188 4.53922L6.93228 4.87708C5.94451 5.31641 5.15288 6.11947 4.7134 7.12811ZM15.3144 9.53285L15.4565 9.67491C16.7513 11.018 17.3306 12.9868 16.8126 14.9201C16.1644 17.3393 13.9702 18.9984 11.5016 18.9984C9.46572 18.9984 6.78847 18.3726 4.5286 17.4841C5.73449 16.0696 6.17423 14.675 6.3285 12.805C6.36574 12.3536 6.38901 12.1741 6.43185 12.0142C7.22541 9.05261 10.0168 7.40515 12.9235 8.18399C13.8549 8.43357 14.6661 8.90783 15.3144 9.53285ZM18.2278 2.3713L13.2886 6.21289C9.34224 5.23923 5.55843 7.54646 4.5 11.4966C4.39826 11.8763 4.36647 12.262 4.33317 12.666C4.21829 14.0599 4.08554 15.6707 1 17.9966C3.5 19.4966 8 20.9984 11.5016 20.9984C14.8142 20.9984 17.8463 18.7896 18.7444 15.4377C19.0836 14.1719 19.0778 12.895 18.7847 11.7067L22.6253 6.76879C22.9349 6.3707 22.8997 5.80435 22.543 5.44774L19.5488 2.45355C19.1922 2.09694 18.6259 2.06168 18.2278 2.3713ZM16.8952 8.2852C16.8319 8.21952 16.7673 8.15494 16.7015 8.09149L15.5769 6.96685L18.7589 4.49198L20.5046 6.23774L18.0297 9.41972L16.8952 8.2852Z" />
            </svg>
            {t('tools.brush')}
          </ToolbarToggleItem>
          <ToolbarSeparator />

          <ToolbarToggleItem
            value="chat"
            disabled={isProcessing}
            aria-label={t('tools.chat')}
            className="cursor-pointer"
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
          className="cursor-pointer"
        >
          <ImageUpscale className="size-4" />
          Upscale
        </ToolbarButton>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon-sm"
              className="text-xs focus-visible:outline-none cursor-pointer"
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

        {activeTool === 'brush' && (
          <>
            <ToolbarSeparator />
            <ToolbarButton asChild>
              <RemoveButton />
            </ToolbarButton>
          </>
        )}
      </Toolbar>
    </div>
  );
}
