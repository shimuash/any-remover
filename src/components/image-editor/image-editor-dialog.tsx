'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBodyAttribute } from '@/hooks/use-body-attribute';
import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';
import CompareView from './compare-view';
import DebugPreview from './debug-preview';
import EditorHeader from './editor-header';
import EditorToolbar from './editor-toolbar';
import { useEditorStoreSelector } from './hooks/use-editor-state';
// Dynamic import for EditorCanvas (SSR compatibility)
const EditorCanvas = dynamic(() => import('./editor-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Loading editor...
      </div>
    </div>
  ),
});

// Fixed height for header and toolbar
const HEADER_HEIGHT = 72;
const TOOLBAR_HEIGHT = 72;

export default function ImageEditorDialog() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { isOpen, closeEditor, isCompareMode } = useEditorStoreSelector(
    (s) => ({
      isOpen: s.isOpen,
      closeEditor: s.closeEditor,
      isCompareMode: s.isCompareMode,
    })
  );

  useBodyAttribute('data-image-editor-open', isOpen);

  const viewportInsets = useMemo(
    () => ({
      top: HEADER_HEIGHT,
      right: 0,
      bottom: isCompareMode ? 0 : TOOLBAR_HEIGHT,
      left: 0,
    }),
    [isCompareMode]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditor()}>
      <DialogContent
        className="!inset-0 !max-w-none !p-0 !gap-0 !translate-x-0 !translate-y-0 !rounded-none !border-none bg-primary-foreground flex flex-col overflow-hidden"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Accessibility: Hidden title and description */}
        <DialogTitle className="sr-only">Image Editor</DialogTitle>
        <DialogDescription className="sr-only">
          Edit your image
        </DialogDescription>

        {/* Header */}
        <EditorHeader />

        {/* Main content area */}
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          {/* Canvas */}
          <EditorCanvas
            containerRef={containerRef}
            viewportInsets={viewportInsets}
          />

          {/* Compare overlay */}
          {isCompareMode && <CompareView viewportInsets={viewportInsets} />}

          {/* Right side controls (zoom, debug) */}
          {!isCompareMode && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
              <DebugPreview />
            </div>
          )}
        </div>

        {/* Bottom controls - only when not in compare mode */}
        {!isCompareMode && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <EditorToolbar />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
