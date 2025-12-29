'use client';

import type Konva from 'konva';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Group, Image, Layer, Stage } from 'react-konva';
import { useDrawing } from './hooks/use-drawing';
import { useEditorStore } from './hooks/use-editor-state';
import { useZoom } from './hooks/use-zoom';
import {
  loadImage,
  resetMaskCanvasState,
  updateMaskCanvasIncremental,
} from './lib/image-compositor';
import { BRUSH_COLOR, BRUSH_OPACITY, type ViewportInsets } from './types';

interface EditorCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewportInsets?: ViewportInsets;
}

const DEFAULT_VIEWPORT_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export default function EditorCanvas({
  containerRef,
  viewportInsets,
}: EditorCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const maskImageRef = useRef<Konva.Image>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  // Cursor position for brush indicator (in image coordinates)
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Ref to cache last pointer-on-image state (avoid unnecessary store updates)
  const lastPointerOnImageRef = useRef(false);

  const {
    currentImage,
    imageSize,
    setImageSize,
    lines,
    zoomLevel,
    stagePosition,
    setStagePosition,
    setViewportBounds,
    isCompareMode,
    activeTool,
    isProcessing,
    isPointerOnImage,
    setPointerOnImage,
    brushSize,
    isEraserMode,
    isBrushSizeAdjusting,
  } = useEditorStore();

  const safeInsets = viewportInsets ?? DEFAULT_VIEWPORT_INSETS;

  // Calculate image position (centered)
  const imagePosition = {
    x: stagePosition.x,
    y: stagePosition.y,
  };

  // Initialize drawing hook
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchEnd: handleDrawingTouchEnd,
  } = useDrawing({
    stageRef,
    imagePosition,
    imageSize,
    scale: zoomLevel,
  });

  // Initialize zoom hook
  const {
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd: handleZoomTouchEnd,
    centerImage,
  } = useZoom({
    containerRef,
    stageRef,
    viewportInsets: safeInsets,
  });

  const isPointerWithinImage = useCallback(() => {
    if (!stageRef.current || !imageSize) return false;

    const pointerPos = stageRef.current.getPointerPosition();
    if (!pointerPos) return false;

    const x = (pointerPos.x - stagePosition.x) / zoomLevel;
    const y = (pointerPos.y - stagePosition.y) / zoomLevel;

    return x >= 0 && y >= 0 && x <= imageSize.width && y <= imageSize.height;
  }, [imageSize, stagePosition, zoomLevel]);

  // Load image when currentImage changes
  useEffect(() => {
    if (!currentImage) {
      setImage(null);
      return;
    }

    loadImage(currentImage)
      .then((img) => {
        setImage(img);
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch(console.error);
  }, [currentImage, setImageSize]);

  // Update stage size when container changes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  // Center image when it loads or container resizes or insets change
  useEffect(() => {
    if (image && imageSize && stageSize.width > 0) {
      centerImage();
    }
  }, [image, imageSize, stageSize, centerImage, safeInsets]);

  useEffect(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) {
      setViewportBounds(null);
      return;
    }

    const width = Math.max(
      0,
      stageSize.width - safeInsets.left - safeInsets.right
    );
    const height = Math.max(
      0,
      stageSize.height - safeInsets.top - safeInsets.bottom
    );

    setViewportBounds({
      width,
      height,
      offsetX: safeInsets.left,
      offsetY: safeInsets.top,
    });
  }, [stageSize, safeInsets, setViewportBounds]);

  useEffect(() => {
    setPointerOnImage(isPointerWithinImage());
  }, [isPointerWithinImage, setPointerOnImage]);

  useEffect(() => {
    if (!imageSize) return;

    let canvas = maskCanvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
      setMaskCanvas(canvas);
    }

    updateMaskCanvasIncremental(canvas, lines, imageSize);
    maskImageRef.current?.getLayer()?.batchDraw();
  }, [imageSize, lines, maskCanvas]);

  // Reset mask canvas state when lines are cleared
  useEffect(() => {
    if (lines.length === 0) {
      resetMaskCanvasState();
    }
  }, [lines.length]);

  // Handle combined touch end
  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      handleDrawingTouchEnd(e);
      handleZoomTouchEnd();
    },
    [handleDrawingTouchEnd, handleZoomTouchEnd]
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const isOnImage = isPointerWithinImage();
      if (lastPointerOnImageRef.current !== isOnImage) {
        lastPointerOnImageRef.current = isOnImage;
        setPointerOnImage(isOnImage);
      }
      handleMouseDown(e);
    },
    [handleMouseDown, isPointerWithinImage, setPointerOnImage]
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const isOnImage = isPointerWithinImage();
      if (lastPointerOnImageRef.current !== isOnImage) {
        lastPointerOnImageRef.current = isOnImage;
        setPointerOnImage(isOnImage);
      }
      handleMouseMove(e);

      // Update cursor position for brush indicator
      if (stageRef.current && imageSize) {
        const pointerPos = stageRef.current.getPointerPosition();
        if (pointerPos) {
          const x = (pointerPos.x - stagePosition.x) / zoomLevel;
          const y = (pointerPos.y - stagePosition.y) / zoomLevel;
          setCursorPosition({ x, y });
        }
      }
    },
    [
      handleMouseMove,
      isPointerWithinImage,
      setPointerOnImage,
      imageSize,
      stagePosition,
      zoomLevel,
    ]
  );

  const handleStageMouseLeave = useCallback(() => {
    lastPointerOnImageRef.current = false;
    setPointerOnImage(false);
    setCursorPosition(null);
    handleMouseUp();
  }, [handleMouseUp, setPointerOnImage]);

  // Handle stage drag for panning
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === stageRef.current) {
        setStagePosition({
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [setStagePosition]
  );

  // Get cursor style based on tool
  const getCursor = () => {
    if (isProcessing) return 'wait';
    if (isCompareMode) return 'grab';
    if (activeTool === 'brush' && isPointerOnImage) {
      return 'none'; // Hide cursor, show custom circle indicator
    }
    return 'default';
  };

  // Determine brush indicator position and visibility
  const showBrushIndicator =
    activeTool === 'brush' && !isCompareMode && !isProcessing;
  const indicatorPosition =
    isBrushSizeAdjusting && imageSize
      ? { x: imageSize.width / 2, y: imageSize.height / 2 } // Center preview when adjusting
      : cursorPosition;
  const showIndicator =
    showBrushIndicator &&
    indicatorPosition &&
    (isPointerOnImage || isBrushSizeAdjusting);

  if (!image || stageSize.width === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{ cursor: getCursor() }}
      className="flex-1 overflow-hidden touch-none"
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleStageMouseLeave}
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleMouseDown(e);
        }}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handleMouseMove(e);
        }}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        draggable={isCompareMode}
        onDragEnd={handleDragEnd}
      >
        {/* Image Layer - Background */}
        <Layer>
          <Group
            x={stagePosition.x}
            y={stagePosition.y}
            scaleX={zoomLevel}
            scaleY={zoomLevel}
          >
            <Image
              image={image}
              width={imageSize?.width || 0}
              height={imageSize?.height || 0}
            />
          </Group>
        </Layer>

        {/* Drawing Layer - Separate layer for mask (CRITICAL for eraser) */}
        {!isCompareMode && (
          <Layer>
            <Group
              x={stagePosition.x}
              y={stagePosition.y}
              scaleX={zoomLevel}
              scaleY={zoomLevel}
              clipX={0}
              clipY={0}
              clipWidth={imageSize?.width || 0}
              clipHeight={imageSize?.height || 0}
            >
              {maskCanvas && !isBrushSizeAdjusting && (
                <Image
                  ref={maskImageRef}
                  image={maskCanvas}
                  width={imageSize?.width || 0}
                  height={imageSize?.height || 0}
                  opacity={BRUSH_OPACITY}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
              {/* Brush cursor indicator */}
              {showIndicator && indicatorPosition && (
                <Circle
                  x={indicatorPosition.x}
                  y={indicatorPosition.y}
                  radius={brushSize / 2}
                  fill={isEraserMode ? 'rgba(255, 255, 255, 0.3)' : BRUSH_COLOR}
                  fillEnabled={true}
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth={1.5 / zoomLevel}
                  opacity={isEraserMode ? 1 : BRUSH_OPACITY}
                  listening={false}
                  perfectDrawEnabled={false}
                />
              )}
            </Group>
          </Layer>
        )}
      </Stage>
    </div>
  );
}
