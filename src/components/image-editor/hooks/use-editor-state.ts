import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import {
  DEFAULT_BRUSH_SIZE,
  type EditorStore,
  type EditorTool,
  type ImageSize,
  type Line,
  MAX_HISTORY,
  MAX_ZOOM,
  MIN_ZOOM,
  type ViewportBounds,
  ZOOM_STEP,
} from '../types';

const clampZoom = (level: number) =>
  Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));

const getCenteredStagePosition = (
  bounds: ViewportBounds,
  imageSize: ImageSize,
  zoomLevel: number
) => ({
  x: bounds.offsetX + (bounds.width - imageSize.width * zoomLevel) / 2,
  y: bounds.offsetY + (bounds.height - imageSize.height * zoomLevel) / 2,
});

const initialState = {
  // Editor visibility
  isOpen: false,

  // Images
  originalImage: null as string | null,
  currentImage: null as string | null,

  // Image dimensions
  imageSize: null as ImageSize | null,

  // Tools
  activeTool: 'brush' as EditorTool,
  brushSize: DEFAULT_BRUSH_SIZE,

  // Drawing
  lines: [] as Line[],

  // History
  imageHistory: [] as string[],
  historyIndex: -1,

  // Zoom
  zoomLevel: 1,
  fitZoomLevel: 1,

  // Viewport bounds (safe area for centering)
  viewportBounds: null as ViewportBounds | null,

  // Pan position
  stagePosition: { x: 0, y: 0 },

  // Modes
  isCompareMode: false,
  comparePosition: 50,
  debugMode: false,
  isEraserMode: false,
  isProcessing: false,
  isPointerOnImage: false,
  isBrushSizeAdjusting: false,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  // Editor controls
  openEditor: (image: string) => {
    set({
      isOpen: true,
      originalImage: image,
      currentImage: image,
      imageHistory: [image],
      historyIndex: 0,
      lines: [],
      activeTool: 'brush',
      isCompareMode: false,
      debugMode: false,
      isProcessing: false,
      zoomLevel: 1,
      stagePosition: { x: 0, y: 0 },
    });
  },

  closeEditor: () => {
    set(initialState);
  },

  // Tool controls
  setActiveTool: (tool: EditorTool) => {
    set({ activeTool: tool });
  },

  setBrushSize: (size: number) => {
    set({ brushSize: Math.max(5, Math.min(100, size)) });
  },

  // Drawing
  addLine: (line: Line) => {
    set((state) => ({
      lines: [...state.lines, line],
    }));
  },

  updateLastLine: (points: number[]) => {
    set((state) => {
      const lines = [...state.lines];
      if (lines.length > 0) {
        lines[lines.length - 1] = {
          ...lines[lines.length - 1],
          points,
        };
      }
      return { lines };
    });
  },

  clearLines: () => {
    set({ lines: [] });
  },

  // History
  pushImageHistory: (image: string) => {
    set((state) => {
      let newHistory = state.imageHistory;

      // If not at the end, truncate redo branch
      if (state.historyIndex < state.imageHistory.length - 1) {
        newHistory = state.imageHistory.slice(0, state.historyIndex + 1);
      }

      // Add new image
      newHistory = [...newHistory, image];

      // Enforce max history limit
      if (newHistory.length > MAX_HISTORY) {
        newHistory = newHistory.slice(1);
      }

      const newIndex = newHistory.length - 1;

      return {
        imageHistory: newHistory,
        historyIndex: newIndex,
        currentImage: image,
        lines: [], // Clear lines when new image is added
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      return {
        historyIndex: newIndex,
        currentImage: state.imageHistory[newIndex],
        lines: [], // Clear lines on undo
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.imageHistory.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      return {
        historyIndex: newIndex,
        currentImage: state.imageHistory[newIndex],
        lines: [], // Clear lines on redo
      };
    });
  },

  // Zoom
  zoomIn: () => {
    set((state) => ({
      zoomLevel: Math.min(MAX_ZOOM, state.zoomLevel + ZOOM_STEP),
    }));
  },

  zoomOut: () => {
    set((state) => ({
      zoomLevel: Math.max(MIN_ZOOM, state.zoomLevel - ZOOM_STEP),
    }));
  },

  setZoomLevel: (level: number) => {
    set({ zoomLevel: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level)) });
  },

  setFitZoomLevel: (level: number) => {
    set({ fitZoomLevel: level });
  },

  toggleZoomReset: () => {
    const state = get();
    const isCloseToFit = Math.abs(state.zoomLevel - state.fitZoomLevel) < 0.05;
    if (isCloseToFit) {
      state.zoomToActual();
      return;
    }
    state.zoomToFit();
  },

  zoomToFit: () => {
    const state = get();
    const targetZoom = clampZoom(state.fitZoomLevel);

    if (!state.imageSize || !state.viewportBounds) {
      set({ zoomLevel: targetZoom });
      return;
    }

    const stagePosition = getCenteredStagePosition(
      state.viewportBounds,
      state.imageSize,
      targetZoom
    );

    set({ zoomLevel: targetZoom, stagePosition });
  },

  zoomToActual: () => {
    const state = get();
    const targetZoom = clampZoom(1);

    if (!state.imageSize || !state.viewportBounds) {
      set({ zoomLevel: targetZoom });
      return;
    }

    const stagePosition = getCenteredStagePosition(
      state.viewportBounds,
      state.imageSize,
      targetZoom
    );

    set({ zoomLevel: targetZoom, stagePosition });
  },

  setViewportBounds: (bounds: ViewportBounds | null) => {
    set({ viewportBounds: bounds });
  },

  // Pan
  setStagePosition: (position: { x: number; y: number }) => {
    set({ stagePosition: position });
  },

  // Image size
  setImageSize: (size: ImageSize) => {
    set({ imageSize: size });
  },

  // Modes
  toggleCompareMode: () => {
    set((state) => ({
      isCompareMode: !state.isCompareMode,
      // Reset zoom when entering compare mode
      ...(state.isCompareMode
        ? {}
        : { zoomLevel: state.fitZoomLevel, stagePosition: { x: 0, y: 0 } }),
    }));
  },

  setComparePosition: (pos: number) => {
    set({ comparePosition: Math.max(0, Math.min(100, pos)) });
  },

  toggleDebugMode: () => {
    set((state) => ({ debugMode: !state.debugMode }));
  },

  toggleEraserMode: () => {
    set((state) => ({ isEraserMode: !state.isEraserMode }));
  },

  setEraserMode: (mode: boolean) => {
    set({ isEraserMode: mode });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  setPointerOnImage: (onImage: boolean) => {
    set({ isPointerOnImage: onImage });
  },

  setBrushSizeAdjusting: (adjusting: boolean) => {
    set({ isBrushSizeAdjusting: adjusting });
  },

  // Computed getters
  hasMask: () => {
    const state = get();
    return state.lines.some((line) => !line.isEraser);
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0 && !state.isProcessing;
  },

  canRedo: () => {
    const state = get();
    return (
      state.historyIndex < state.imageHistory.length - 1 && !state.isProcessing
    );
  },
}));

/**
 * Convenience selector hook with shallow comparison
 * Use this to subscribe to specific fields only, avoiding unnecessary re-renders
 */
export function useEditorStoreSelector<T>(
  selector: (state: EditorStore) => T
): T {
  return useEditorStore(useShallow(selector));
}
