'use client';

import { Button } from '@/components/ui/button';
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import {
  ArrowLeft,
  Download,
  Redo2,
  SplitSquareHorizontal,
  Undo2,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef } from 'react';
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
  }));

  const handleDownload = () => {
    if (currentImage) {
      downloadImage(currentImage);
    }
  };

  const canCompare = imageHistory.length > 1 && !isProcessing;

  return (
    <header
      ref={ref}
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 sm:py-4 pointer-events-none"
    >
      {/* Left: Close button */}
      <Button
        variant="outline"
        size="icon-lg"
        className="focus-visible:outline-none rounded-lg cursor-pointer pointer-events-auto"
        onClick={closeEditor}
      >
        <ArrowLeft className="size-5" />
      </Button>

      <Toolbar size="sm" className="pointer-events-auto">
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
