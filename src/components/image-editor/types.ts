// Editor tool types
export type EditorTool = 'brush' | 'chat';

// Line interface for drawing strokes
export interface Line {
  points: number[]; // [x1, y1, x2, y2, ...] in image coordinates
  strokeWidth: number;
  isEraser: boolean; // true for eraser strokes (uses destination-out)
}

// Image size interface
export interface ImageSize {
  width: number;
  height: number;
}

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportBounds {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

// Transform state for canvas
export interface TransformState {
  scale: number;
  x: number;
  y: number;
}

// Editor state interface
export interface EditorState {
  // Editor visibility
  isOpen: boolean;

  // Images
  originalImage: string | null; // First uploaded image (for compare)
  currentImage: string | null; // Current working image

  // Image dimensions
  imageSize: ImageSize | null;

  // Tools
  activeTool: EditorTool;
  brushSize: number; // 5-100, default 40

  // Drawing
  lines: Line[];

  // History (image versions only)
  imageHistory: string[];
  historyIndex: number;

  // Zoom
  zoomLevel: number; // 0.1 - 5.0
  fitZoomLevel: number; // Calculated fit-to-window zoom

  // Viewport (safe area) bounds for centering
  viewportBounds: ViewportBounds | null;

  // Pan position
  stagePosition: { x: number; y: number };

  // Modes
  isCompareMode: boolean;
  comparePosition: number; // 0-100
  debugMode: boolean;
  isEraserMode: boolean; // True when brush subtracts from mask
  isProcessing: boolean;
  isPointerOnImage: boolean; // True when mouse/touch is over the image
  isBrushSizeAdjusting: boolean; // True when user is adjusting brush size (show center preview)
}

// Editor actions interface
export interface EditorActions {
  // Editor controls
  openEditor: (image: string) => void;
  closeEditor: () => void;

  // Tool controls
  setActiveTool: (tool: EditorTool) => void;
  setBrushSize: (size: number) => void;

  // Drawing
  addLine: (line: Line) => void;
  updateLastLine: (points: number[]) => void;
  clearLines: () => void;

  // History
  pushImageHistory: (image: string) => void;
  undo: () => void;
  redo: () => void;

  // Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomLevel: (level: number) => void;
  setFitZoomLevel: (level: number) => void;
  toggleZoomReset: () => void;
  zoomToFit: () => void;
  zoomToActual: () => void;

  // Viewport bounds
  setViewportBounds: (bounds: ViewportBounds | null) => void;

  // Pan
  setStagePosition: (position: { x: number; y: number }) => void;

  // Image size
  setImageSize: (size: ImageSize) => void;

  // Modes
  toggleCompareMode: () => void;
  setComparePosition: (pos: number) => void;
  toggleDebugMode: () => void;
  toggleEraserMode: () => void;
  setEraserMode: (mode: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setPointerOnImage: (onImage: boolean) => void;
  setBrushSizeAdjusting: (adjusting: boolean) => void;
}

// Combined store type
export type EditorStore = EditorState &
  EditorActions & {
    // Computed getters
    hasMask: () => boolean;
    canUndo: () => boolean;
    canRedo: () => boolean;
  };

// API request/response types
export interface InpaintRequest {
  image: string; // base64 composite image
}

export interface InpaintResponse {
  image: string; // base64 result
}

export interface ChatEditRequest {
  image: string; // base64 current image
  prompt: string;
}

export interface ChatEditResponse {
  image: string; // base64 result
}

// Constants
export const BRUSH_COLOR = '#FF007A';
export const BRUSH_OPACITY = 0.5;
export const DEFAULT_BRUSH_SIZE = 50;
export const MIN_BRUSH_SIZE = 5;
export const MAX_BRUSH_SIZE = 100;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;
export const MAX_HISTORY = 15;
export const MAX_IMAGE_SIZE = 4096;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
