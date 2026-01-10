'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useEditorStore } from './hooks/use-editor-state';
import { generateCompositeImage, loadImage } from './lib/image-compositor';

export function RemoveButton() {
  const t = useTranslations('ImageEditor');

  const {
    currentImage,
    lines,
    hasMask,
    isProcessing,
    isCompareMode,
    setProcessing,
    pushImageHistory,
    setActiveTool,
  } = useEditorStore();

  const handleRemove = useCallback(async () => {
    if (!currentImage || !hasMask()) return;

    setProcessing(true);

    try {
      // Load current image
      const img = await loadImage(currentImage);

      // Generate composite image
      const compositeImage = generateCompositeImage(img, lines);

      // Call API
      const response = await fetch('/api/image-edit/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compositeImage }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const result = await response.json();

      // Push result to history
      pushImageHistory(result.image);
      setActiveTool('brush');

      toast.success(t('removeSuccess') || 'Image processed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(t('errors.processingFailed'));
    } finally {
      setProcessing(false);
    }
  }, [
    currentImage,
    lines,
    hasMask,
    setProcessing,
    pushImageHistory,
    setActiveTool,
    t,
  ]);

  if (isCompareMode) {
    return null;
  }

  const isDisabled = !hasMask() || isProcessing;

  return (
    <Button
      onClick={handleRemove}
      disabled={isDisabled}
      className="cursor-pointer"
    >
      {isProcessing ? (
        <>
          <Spinner />
          {t('applying')}
        </>
      ) : (
        <>
          <Sparkles className="size-4" />
          {t('apply')}
        </>
      )}
    </Button>
  );
}
