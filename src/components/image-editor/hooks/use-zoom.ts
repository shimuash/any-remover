import type Konva from 'konva';
import { useCallback, useEffect, useRef } from 'react';
import { MAX_ZOOM, MIN_ZOOM, type ViewportInsets } from '../types';
import { useEditorStore } from './use-editor-state';

interface UseZoomOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<Konva.Stage | null>;
  viewportInsets?: ViewportInsets;
}

const DEFAULT_VIEWPORT_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export function useZoom({
  containerRef,
  stageRef,
  viewportInsets,
}: UseZoomOptions) {
  const lastPinchDistanceRef = useRef<number>(0);
  const lastPinchCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasAppliedInitialFitRef = useRef(false);

  const {
    imageSize,
    zoomLevel,
    setZoomLevel,
    setFitZoomLevel,
    stagePosition,
    setStagePosition,
    isCompareMode,
  } = useEditorStore();

  const safeInsets = viewportInsets ?? DEFAULT_VIEWPORT_INSETS;

  const getViewportSize = useCallback(() => {
    if (!containerRef.current) {
      return { width: 0, height: 0, inset: safeInsets };
    }

    const container = containerRef.current;
    const width = Math.max(
      0,
      container.clientWidth - safeInsets.left - safeInsets.right
    );
    const height = Math.max(
      0,
      container.clientHeight - safeInsets.top - safeInsets.bottom
    );

    return { width, height, inset: safeInsets };
  }, [containerRef, safeInsets]);

  // Calculate fit zoom level based on container and image size
  const calculateFitZoom = useCallback(() => {
    if (!imageSize) return 1;

    const { width, height } = getViewportSize();

    if (width <= 0 || height <= 0) return 1;

    // Account for padding
    const padding = 40;
    const availableWidth = Math.max(0, width - padding * 2);
    const availableHeight = Math.max(0, height - padding * 2);

    const scaleX = availableWidth / imageSize.width;
    const scaleY = availableHeight / imageSize.height;

    // Use the smaller scale to fit the image completely
    const fitScale = Math.min(scaleX, scaleY, 1); // Don't exceed 1:1

    return fitScale;
  }, [imageSize, getViewportSize]);

  useEffect(() => {
    hasAppliedInitialFitRef.current = false;
  }, [imageSize]);

  // Update fit zoom when container or image size changes
  useEffect(() => {
    const fitZoom = calculateFitZoom();
    setFitZoomLevel(fitZoom);

    // Also set initial zoom to fit
    if (imageSize && !hasAppliedInitialFitRef.current) {
      setZoomLevel(fitZoom);
      hasAppliedInitialFitRef.current = true;
    }
  }, [calculateFitZoom, setFitZoomLevel, setZoomLevel, imageSize]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      if (isCompareMode) return;

      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = zoomLevel;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate zoom direction
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp to min/max
      const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

      // Calculate new position to zoom towards pointer
      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setZoomLevel(clampedScale);
      setStagePosition(newPos);
    },
    [
      isCompareMode,
      stageRef,
      zoomLevel,
      stagePosition,
      setZoomLevel,
      setStagePosition,
    ]
  );

  // Calculate distance between two touch points
  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      (touch2.clientX - touch1.clientX) ** 2 +
        (touch2.clientY - touch1.clientY) ** 2
    );
  };

  // Get center point between two touches
  const getCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Handle pinch zoom start
  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches;
      if (touches.length === 2) {
        lastPinchDistanceRef.current = getDistance(touches);
        lastPinchCenterRef.current = getCenter(touches);
      }
    },
    []
  );

  // Handle pinch zoom move
  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (isCompareMode) return;

      const touches = e.evt.touches;
      if (touches.length !== 2) return;

      const newDistance = getDistance(touches);
      const newCenter = getCenter(touches);

      if (lastPinchDistanceRef.current === 0) {
        lastPinchDistanceRef.current = newDistance;
        lastPinchCenterRef.current = newCenter;
        return;
      }

      // Calculate scale change
      const scale = newDistance / lastPinchDistanceRef.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scale));

      // Calculate position change
      const dx = newCenter.x - lastPinchCenterRef.current.x;
      const dy = newCenter.y - lastPinchCenterRef.current.y;

      setZoomLevel(newZoom);
      setStagePosition({
        x: stagePosition.x + dx,
        y: stagePosition.y + dy,
      });

      lastPinchDistanceRef.current = newDistance;
      lastPinchCenterRef.current = newCenter;
    },
    [isCompareMode, zoomLevel, stagePosition, setZoomLevel, setStagePosition]
  );

  // Handle pinch zoom end
  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = 0;
  }, []);

  // Center the image in the container
  const centerImage = useCallback(() => {
    if (!imageSize) return;

    const { width, height, inset } = getViewportSize();

    if (width <= 0 || height <= 0) return;
    const scaledWidth = imageSize.width * zoomLevel;
    const scaledHeight = imageSize.height * zoomLevel;

    const x = inset.left + (width - scaledWidth) / 2;
    const y = inset.top + (height - scaledHeight) / 2;

    setStagePosition({ x, y });
  }, [getViewportSize, imageSize, zoomLevel, setStagePosition]);

  return {
    calculateFitZoom,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    centerImage,
  };
}
