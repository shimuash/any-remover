'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useEditorStore } from './hooks/use-editor-state';

interface ChatPanelProps {
  className?: string;
  maxWidth?: number;
}

export default function ChatPanel({ className, maxWidth }: ChatPanelProps) {
  const t = useTranslations('ImageEditor');
  const [prompt, setPrompt] = useState('');

  const {
    currentImage,
    activeTool,
    isProcessing,
    isCompareMode,
    setProcessing,
    pushImageHistory,
    setActiveTool,
  } = useEditorStore();

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !currentImage || isProcessing) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/image-edit/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentImage,
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const result = await response.json();

      // Push result to history
      pushImageHistory(result.image);
      setActiveTool('brush');
      setPrompt('');

      toast.success(t('chatSuccess') || 'Image edited successfully');
    } catch (error) {
      console.error('Chat edit error:', error);
      toast.error(t('errors.processingFailed'));
    } finally {
      setProcessing(false);
    }
  }, [
    prompt,
    currentImage,
    isProcessing,
    setProcessing,
    pushImageHistory,
    setActiveTool,
    t,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Only show when chat tool is active
  if (activeTool !== 'chat' || isCompareMode) {
    return null;
  }

  return (
    <InputGroup
      className={cn(
        'w-full bg-background focus-visible:outline-none rounded-3xl px-2 py-1',
        className
      )}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <InputGroupTextarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('chatPlaceholder')}
        disabled={isProcessing}
        rows={1}
        className="text-base min-h-auto h-auto"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          variant="default"
          onClick={handleSubmit}
          disabled={!prompt.trim() || isProcessing}
          className="ml-auto rounded-full cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowRight className="size-5" />
          )}
          <span className="sr-only">Generate</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
