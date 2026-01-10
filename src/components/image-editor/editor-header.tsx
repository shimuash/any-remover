'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import {
  ChevronDown,
  Download,
  Redo2,
  SplitSquareHorizontal,
  Undo2,
  Wrench,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef } from 'react';
import { useKey } from 'react-use';
import { useEditorStoreSelector } from './hooks/use-editor-state';
import { downloadImage } from './lib/image-compositor';

const EditorHeader = forwardRef<HTMLElement>(function EditorHeader(_, ref) {
  const t = useTranslations('ImageEditor');

  const {
    currentImage,
    closeEditor,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleCompareMode,
    isCompareMode,
    toggleDebugMode,
    imageHistory,
    isProcessing,
    zoomLevel,
    zoomIn,
    zoomOut,
    zoomToActual,
    zoomToFit,
  } = useEditorStoreSelector((s) => ({
    currentImage: s.currentImage,
    closeEditor: s.closeEditor,
    undo: s.undo,
    redo: s.redo,
    canUndo: s.canUndo,
    canRedo: s.canRedo,
    toggleCompareMode: s.toggleCompareMode,
    isCompareMode: s.isCompareMode,
    toggleDebugMode: s.toggleDebugMode,
    imageHistory: s.imageHistory,
    isProcessing: s.isProcessing,
    zoomLevel: s.zoomLevel,
    zoomIn: s.zoomIn,
    zoomOut: s.zoomOut,
    zoomToActual: s.zoomToActual,
    zoomToFit: s.zoomToFit,
  }));

  // Zoom keyboard shortcuts
  useKey(
    (e) => (e.metaKey || e.ctrlKey) && e.key === '=',
    (e) => {
      e.preventDefault();
      zoomIn();
    },
    { event: 'keydown' },
    [zoomIn]
  );

  useKey(
    (e) => (e.metaKey || e.ctrlKey) && e.key === '-',
    (e) => {
      e.preventDefault();
      zoomOut();
    },
    { event: 'keydown' },
    [zoomOut]
  );

  useKey(
    (e) => (e.metaKey || e.ctrlKey) && e.key === '2',
    (e) => {
      e.preventDefault();
      zoomToActual();
    },
    { event: 'keydown' },
    [zoomToActual]
  );

  useKey(
    (e) => (e.metaKey || e.ctrlKey) && e.key === '1',
    (e) => {
      e.preventDefault();
      zoomToFit();
    },
    { event: 'keydown' },
    [zoomToFit]
  );

  const handleDownload = () => {
    if (currentImage) {
      downloadImage(currentImage);
    }
  };

  const canCompare = imageHistory.length > 1 && !isProcessing;
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <header
      ref={ref}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
    >
      {/* Left: Close button */}
      <Button
        variant="outline"
        size="icon-lg"
        className="size-11 rounded-xl focus-visible:outline-none"
        onClick={closeEditor}
      >
        <X className="size-5" />
      </Button>

      <Toolbar size="sm">
        <ToolbarToggleGroup type="single">
          <ToolbarToggleItem value="debug" onClick={toggleDebugMode}>
            <Wrench className="size-4" />
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarToggleGroup type="single">
          <ToolbarToggleItem
            className="cursor-pointer"
            value="undo"
            onClick={undo}
            disabled={!canUndo()}
          >
            <Undo2 className="size-4" />
          </ToolbarToggleItem>
          <ToolbarToggleItem
            className="cursor-pointer"
            value="redo"
            onClick={redo}
            disabled={!canRedo()}
          >
            <Redo2 className="size-4" />
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />
        <ToolbarToggleGroup type="single">
          <ToolbarToggleItem
            value="compare"
            onClick={toggleCompareMode}
            disabled={!canCompare}
            className="cursor-pointer"
          >
            <SplitSquareHorizontal className="size-4" />
            {t('tools.compare')}
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
        <ToolbarSeparator />

        {/* Zoom Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="text-xs focus-visible:outline-none cursor-pointer"
              disabled={isCompareMode}
            >
              {zoomPercent}%
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44" align="end" sideOffset={14}>
            <DropdownMenuItem onClick={zoomIn}>
              Zoom In
              <DropdownMenuShortcut>
                <span className="inline-flex min-w-3 items-center justify-center">
                  ⌘
                </span>
                <span className="inline-flex min-w-3 items-center justify-center">
                  +
                </span>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={zoomOut}>
              Zoom Out
              <DropdownMenuShortcut>
                <span className="inline-flex min-w-3 items-center justify-center">
                  ⌘
                </span>
                <span className="inline-flex min-w-3 items-center justify-center">
                  -
                </span>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={zoomToActual}>
              Zoom to 100%
              <DropdownMenuShortcut>
                <span className="inline-flex min-w-3 items-center justify-center">
                  ⌘
                </span>
                <span className="inline-flex min-w-3 items-center justify-center">
                  2
                </span>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={zoomToFit}>
              Zoom to Fit
              <DropdownMenuShortcut>
                <span className="inline-flex min-w-3 items-center justify-center">
                  ⌘
                </span>
                <span className="inline-flex min-w-3 items-center justify-center">
                  1
                </span>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarSeparator />
        <Button onClick={handleDownload} title={t('tools.download')}>
          <Download className="size-4" />
          Download
        </Button>
      </Toolbar>
    </header>
  );
});

EditorHeader.displayName = 'EditorHeader';

export default EditorHeader;
