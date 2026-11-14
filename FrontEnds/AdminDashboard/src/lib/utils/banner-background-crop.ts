import type { Area } from 'react-easy-crop';

/** Full-width banner crop aspect (width / height), max display height 200px. */
export const BANNER_COVER_ASPECT = 9.6;

export const BANNER_OUTPUT_WIDTH = 1920;
export const BANNER_OUTPUT_HEIGHT = 200;
export const BANNER_MAX_FILE_BYTES = 8 * 1024 * 1024;

export function validateBannerImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'invalidType';
  }
  if (file.size > BANNER_MAX_FILE_BYTES) {
    return 'tooLarge';
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

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
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

export async function getCroppedBannerImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
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

  outputCanvas.width = BANNER_OUTPUT_WIDTH;
  outputCanvas.height = BANNER_OUTPUT_HEIGHT;
  outputCtx.drawImage(croppedCanvas, 0, 0, BANNER_OUTPUT_WIDTH, BANNER_OUTPUT_HEIGHT);

  return canvasToJpegBlob(outputCanvas);
}

export async function readBannerImageDimensions(
  file: File
): Promise<{ width: number; height: number; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return { width: image.width, height: image.height, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
