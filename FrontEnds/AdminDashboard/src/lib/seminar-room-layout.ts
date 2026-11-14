export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PixelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
}

/** Default teacher PIP overlay as fractions of the stage container. */
export function defaultNormalizedPipRect(mobile = isMobileViewport()): NormalizedRect {
  const width = mobile ? 0.42 : 0.24;
  const height = mobile ? 0.3 : 0.18;
  return {
    width,
    height,
    x: 1 - width - 0.03,
    y: 1 - height - 0.03,
  };
}

export function pixelsToNormalized(
  rect: PixelRect,
  containerWidth: number,
  containerHeight: number
): NormalizedRect {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return defaultNormalizedPipRect();
  }
  return {
    x: rect.x / containerWidth,
    y: rect.y / containerHeight,
    width: rect.width / containerWidth,
    height: rect.height / containerHeight,
  };
}

export function normalizedToPixels(
  rect: NormalizedRect,
  containerWidth: number,
  containerHeight: number,
  options?: { enlarged?: boolean }
): PixelRect {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let { x, y, width, height } = rect;
  if (options?.enlarged) {
    const enlargeFactor = isMobileViewport() ? 1.35 : 1.6;
    width = Math.min(width * enlargeFactor, 0.92);
    height = Math.min(height * enlargeFactor, 0.92);
  }

  width = Math.min(Math.max(width, 0.12), 0.95);
  height = Math.min(Math.max(height, 0.12), 0.95);
  x = Math.min(Math.max(x, 0), 1 - width);
  y = Math.min(Math.max(y, 0), 1 - height);

  return clampPixelRect(
    {
      x: x * containerWidth,
      y: y * containerHeight,
      width: width * containerWidth,
      height: height * containerHeight,
    },
    containerWidth,
    containerHeight
  );
}

export function clampPixelRect(
  rect: PixelRect,
  containerWidth: number,
  containerHeight: number
): PixelRect {
  const minWidth = Math.min(96, containerWidth * 0.18);
  const minHeight = Math.min(72, containerHeight * 0.14);
  const width = Math.min(Math.max(rect.width, minWidth), containerWidth);
  const height = Math.min(Math.max(rect.height, minHeight), containerHeight);
  const x = Math.min(Math.max(rect.x, 0), Math.max(0, containerWidth - width));
  const y = Math.min(Math.max(rect.y, 0), Math.max(0, containerHeight - height));
  return { x, y, width, height };
}

export function getDisplayPipRect(
  rect: PixelRect,
  containerWidth: number,
  containerHeight: number,
  enlarged: boolean
): PixelRect {
  if (!enlarged) {
    return clampPixelRect(rect, containerWidth, containerHeight);
  }

  const mobile = isMobileViewport();
  const factor = mobile ? 1.35 : 1.6;
  const maxW = containerWidth * (mobile ? 0.88 : 0.72);
  const maxH = containerHeight * (mobile ? 0.82 : 0.72);
  const width = Math.min(rect.width * factor, maxW);
  const height = Math.min(rect.height * factor, maxH);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return clampPixelRect(
    {
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    },
    containerWidth,
    containerHeight
  );
}

export function defaultPipPixelRect(containerWidth: number, containerHeight: number): PixelRect {
  const normalized = defaultNormalizedPipRect(isMobileViewport());
  return normalizedToPixels(normalized, containerWidth, containerHeight);
}

/** Must match MeetingHub.MaxConcurrentScreenShares; optimized for 4-5 person mesh rooms. */
export const MAX_CONCURRENT_SCREEN_SHARES = 4;

export type StageGridMode = 'solo' | 'split2' | 'teacher-row';

export type StagePublisherInfo = {
  connectionId: string;
  userName: string;
  isLocal: boolean;
  isTeacher: boolean;
  hasScreen: boolean;
  hasCamera: boolean;
};

export function stageGridMode(count: number): StageGridMode {
  if (count <= 1) return 'solo';
  if (count === 2) return 'split2';
  return 'teacher-row';
}

/** CSS grid classes for the multi-presenter stage. */
export function stageGridClassName(mode: StageGridMode, teacherCount: number, studentCount: number): string {
  if (mode === 'solo') return 'grid grid-cols-1 grid-rows-1';
  if (mode === 'split2') {
    return 'grid grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1';
  }
  const topCols = Math.max(1, teacherCount);
  const bottomCols = Math.max(1, studentCount);
  return cnStageGrid(topCols, bottomCols);
}

function cnStageGrid(topCols: number, bottomCols: number): string {
  // Use inline style for dynamic columns from the component; provide a sensible default class.
  void topCols;
  void bottomCols;
  return 'grid gap-1';
}

export function partitionStagePublishers(publishers: StagePublisherInfo[]): {
  teachers: StagePublisherInfo[];
  students: StagePublisherInfo[];
} {
  const teachers = publishers.filter((p) => p.isTeacher);
  const students = publishers.filter((p) => !p.isTeacher);
  if (teachers.length === 0 && publishers.length > 0) {
    return { teachers: [publishers[0]], students: publishers.slice(1) };
  }
  return { teachers, students };
}
