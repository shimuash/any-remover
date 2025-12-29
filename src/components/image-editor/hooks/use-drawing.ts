import type Konva from 'konva';
import { useCallback, useRef, useState } from 'react';
import { useEditorStore, useEditorStoreSelector } from './use-editor-state';

interface UseDrawingOptions {
  stageRef: React.RefObject<Konva.Stage | null>;
  imagePosition: { x: number; y: number };
  imageSize: { width: number; height: number } | null;
  scale: number;
}

interface TouchState {
  isDrawing: boolean;
  isPinching: boolean;
  lastPinchDistance: number;
}

export function useDrawing({
  stageRef,
  imagePosition,
  imageSize,
  scale,
}: UseDrawingOptions) {
  const [isDrawing, setIsDrawing] = useState(false);
  const touchStateRef = useRef<TouchState>({
    isDrawing: false,
    isPinching: false,
    lastPinchDistance: 0,
  });

  // Ref to cache current stroke points (avoid re-render on every move)
  const currentStrokeRef = useRef<number[]>([]);
  // rAF throttling for store updates
  const rafIdRef = useRef<number | undefined>(undefined);

  const {
    activeTool,
    brushSize,
    isProcessing,
    isCompareMode,
    isEraserMode,
    addLine,
    updateLastLine,
  } = useEditorStoreSelector((s) => ({
    activeTool: s.activeTool,
    brushSize: s.brushSize,
    isProcessing: s.isProcessing,
    isCompareMode: s.isCompareMode,
    isEraserMode: s.isEraserMode,
    addLine: s.addLine,
    updateLastLine: s.updateLastLine,
  }));

  // Convert screen coordinates to image coordinates
  const screenToImageCoords = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } | null => {
      if (!stageRef.current || !imageSize) return null;

      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return null;

      // Convert to image coordinates
      const x = (pointerPos.x - imagePosition.x) / scale;
      const y = (pointerPos.y - imagePosition.y) / scale;

      // Check if the point is within the image bounds
      if (x < 0 || y < 0 || x > imageSize.width || y > imageSize.height) {
        return null;
      }

      return { x, y };
    },
    [stageRef, imagePosition, imageSize, scale]
  );

  // Check if drawing is allowed
  const canDraw = useCallback(() => {
    return !isProcessing && !isCompareMode && activeTool === 'brush';
  }, [isProcessing, isCompareMode, activeTool]);

  // Start drawing
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!canDraw()) return;

      // Check for touch events
      const touchEvent = e.evt as TouchEvent;
      if (touchEvent.touches) {
        // If more than one finger, don't start drawing (it's a pinch gesture)
        if (touchEvent.touches.length > 1) {
          touchStateRef.current.isPinching = true;
          return;
        }
      }

      const coords = screenToImageCoords(0, 0);
      if (!coords) return;

      setIsDrawing(true);
      touchStateRef.current.isDrawing = true;

      // Initialize ref cache for current stroke
      currentStrokeRef.current = [coords.x, coords.y];

      // Create new line - use isEraserMode from store
      addLine({
        points: [coords.x, coords.y],
        strokeWidth: brushSize,
        isEraser: isEraserMode,
      });
    },
    [canDraw, screenToImageCoords, addLine, brushSize, isEraserMode]
  );

  // Continue drawing
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      // Check for touch events - cancel drawing if pinching
      const touchEvent = e.evt as TouchEvent;
      if (touchEvent.touches && touchEvent.touches.length > 1) {
        if (touchStateRef.current.isDrawing) {
          // Cancel current stroke when switching to pinch
          setIsDrawing(false);
          touchStateRef.current.isDrawing = false;
        }
        touchStateRef.current.isPinching = true;
        return;
      }

      if (!isDrawing || !touchStateRef.current.isDrawing) return;
      if (!canDraw()) return;

      const coords = screenToImageCoords(0, 0);
      if (!coords) return;

      // Accumulate points in ref (no re-render)
      currentStrokeRef.current.push(coords.x, coords.y);

      // Throttle store updates with rAF
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (currentStrokeRef.current.length > 0) {
            updateLastLine([...currentStrokeRef.current]);
          }
          rafIdRef.current = undefined;
        });
      }
    },
    [isDrawing, canDraw, screenToImageCoords, updateLastLine]
  );

  // End drawing
  const handleMouseUp = useCallback(() => {
    // Final commit of stroke points
    if (currentStrokeRef.current.length > 0) {
      updateLastLine([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }

    // Cancel any pending rAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = undefined;
    }

    setIsDrawing(false);
    touchStateRef.current.isDrawing = false;
    touchStateRef.current.isPinching = false;
  }, [updateLastLine]);

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touchEvent = e.evt as TouchEvent;
      if (touchEvent.touches.length === 0) {
        // All fingers lifted
        setIsDrawing(false);
        touchStateRef.current.isDrawing = false;
        touchStateRef.current.isPinching = false;
      }
    },
    []
  );

  return {
    isDrawing,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchEnd,
    canDraw,
  };
}
