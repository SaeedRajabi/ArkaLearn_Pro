import type { Area } from 'react-easy-crop';

/** Banner aspect ratio (width / height) — matches professor dashboard cover. */
export const HEADER_COVER_ASPECT = 4;

export const HEADER_MIN_WIDTH = 800;
export const HEADER_MIN_HEIGHT = 200;
export const HEADER_OUTPUT_WIDTH = 1600;
export const HEADER_OUTPUT_HEIGHT = 400;
export const HEADER_MAX_FILE_BYTES = 8 * 1024 * 1024;

export type HeaderImageFilters = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export const DEFAULT_HEADER_IMAGE_FILTERS: HeaderImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export function validateHeaderImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'invalidType';
  }
  if (file.size > HEADER_MAX_FILE_BYTES) {
    return 'tooLarge';
  }
  return null;
}

export function validateHeaderImageDimensions(width: number, height: number): string | null {
  if (width < HEADER_MIN_WIDTH || height < HEADER_MIN_HEIGHT) {
    return 'tooSmall';
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Failed to load image')));
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = src;
  });
}

function getRadianAngle(degree: number): number {
  return (degree * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export image'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function getCroppedHeaderImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  filters: HeaderImageFilters = DEFAULT_HEADER_IMAGE_FILTERS
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('Canvas not supported');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Canvas not supported');

  outputCanvas.width = HEADER_OUTPUT_WIDTH;
  outputCanvas.height = HEADER_OUTPUT_HEIGHT;

  const filterValue = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
  const hasFilters =
    filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100;

  try {
    if (hasFilters) {
      outputCtx.filter = filterValue;
    }
    outputCtx.drawImage(croppedCanvas, 0, 0, HEADER_OUTPUT_WIDTH, HEADER_OUTPUT_HEIGHT);
    return await canvasToJpegBlob(outputCanvas);
  } catch {
    outputCtx.filter = 'none';
    outputCtx.clearRect(0, 0, HEADER_OUTPUT_WIDTH, HEADER_OUTPUT_HEIGHT);
    outputCtx.drawImage(croppedCanvas, 0, 0, HEADER_OUTPUT_WIDTH, HEADER_OUTPUT_HEIGHT);
    return await canvasToJpegBlob(outputCanvas);
  }
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return { width: image.width, height: image.height, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
