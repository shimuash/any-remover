'use client';

import { useEditorStore } from '@/components/image-editor/hooks/use-editor-state';
import ImageEditorDialog from '@/components/image-editor/image-editor-dialog';
import {
  fileToBase64,
  resizeImageIfNeeded,
  validateImageFile,
} from '@/components/image-editor/lib/image-compositor';
import { cn } from '@/lib/utils';
import { CloudUpload, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploaderProps {
  className?: string;
}

export default function ImageUploader({ className }: ImageUploaderProps) {
  const t = useTranslations('HomePage.remover');
  const tEditor = useTranslations('ImageEditor');
  const openEditor = useEditorStore((state) => state.openEditor);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(tEditor(`errors.${validation.error}`));
        return;
      }

      try {
        // Convert to base64
        let base64 = await fileToBase64(file);

        // Resize if needed (max 4096px)
        base64 = await resizeImageIfNeeded(base64);

        // Open the editor
        openEditor(base64);
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error(tEditor('errors.processingFailed'));
      }
    },
    [openEditor, tEditor]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  // Handle example image click
  const handleExampleClick = async (index: number) => {
    // Example images - replace with actual example image URLs
    const exampleImages = [
      '/examples/example-1.jpg',
      '/examples/example-2.jpg',
      '/examples/example-3.jpg',
      '/examples/example-4.jpg',
    ];

    const imageUrl = exampleImages[index];
    if (!imageUrl) return;

    try {
      // Fetch the example image and convert to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `example-${index}.jpg`, {
        type: blob.type,
      });

      let base64 = await fileToBase64(file);
      base64 = await resizeImageIfNeeded(base64);
      openEditor(base64);
    } catch (error) {
      console.error('Error loading example image:', error);
      toast.error(tEditor('errors.processingFailed'));
    }
  };

  return (
    <>
      {/* Image Editor Dialog */}
      <ImageEditorDialog />

      <div className={cn('mt-12 md:mt-16', className)}>
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'relative min-h-[320px] rounded-2xl border-2 border-dashed cursor-pointer',
            'flex flex-col items-center justify-center gap-4 p-8',
            'transition-all duration-200',
            isDragActive
              ? 'border-primary bg-primary/5 border-solid'
              : 'border-muted-foreground/30 bg-muted/20 hover:bg-muted/30 hover:border-muted-foreground/50'
          )}
        >
          <input {...getInputProps()} />

          <div
            className={cn(
              'rounded-full p-4 transition-colors duration-200',
              isDragActive ? 'bg-primary/10' : 'bg-muted/50'
            )}
          >
            <CloudUpload
              className={cn(
                'size-12 transition-colors duration-200',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="text-center space-y-2">
            <p
              className={cn(
                'text-lg font-medium transition-colors duration-200',
                isDragActive ? 'text-primary' : 'text-foreground'
              )}
            >
              {isDragActive ? t('dropzone.dragActive') : t('dropzone.title')}
            </p>
            {!isDragActive && (
              <p className="text-sm text-muted-foreground">
                {t('dropzone.subtitle')}
              </p>
            )}
            <p className="text-xs text-muted-foreground/70">
              {t('dropzone.hint')}
            </p>
          </div>
        </div>

        {/* Example Images */}
        <div className="mt-4 grid grid-cols-4 gap-3 md:gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              onClick={() => handleExampleClick(index)}
              className={cn(
                'aspect-[4/3] rounded-lg cursor-pointer overflow-hidden',
                'bg-muted/40 border border-muted-foreground/10',
                'flex items-center justify-center',
                'transition-all duration-200',
                'hover:opacity-80 hover:scale-[1.02] hover:border-muted-foreground/30'
              )}
            >
              <ImageIcon className="size-8 text-muted-foreground/40" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
