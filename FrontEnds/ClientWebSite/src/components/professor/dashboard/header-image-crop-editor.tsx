'use client';

import 'react-easy-crop/react-easy-crop.css';
import * as React from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Contrast, RotateCcw, RotateCw, Sun, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useProfessorDict } from '@/lib/use-professor-dict';
import { cn } from '@/lib/utils';
import {
  DEFAULT_HEADER_IMAGE_FILTERS,
  HEADER_COVER_ASPECT,
  type HeaderImageFilters,
} from '@/lib/utils/header-image-editor';
import type { Dictionary } from '@/types';

type HeaderImageCropEditorProps = {
  dict: Dictionary;
  translationPrefix: string;
  imageSrc: string;
  isRtl: boolean;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  filters: HeaderImageFilters;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onFiltersChange: (filters: HeaderImageFilters) => void;
  onCropComplete: (area: Area) => void;
};

export function HeaderImageCropEditor({
  dict,
  translationPrefix,
  imageSrc,
  isRtl,
  crop,
  zoom,
  rotation,
  filters,
  onCropChange,
  onZoomChange,
  onRotationChange,
  onFiltersChange,
  onCropComplete,
}: HeaderImageCropEditorProps) {
  const t = useProfessorDict(dict);
  const translate = React.useCallback(
    (suffix: string, fallback: string) => t(`${translationPrefix}.${suffix}`, fallback),
    [t, translationPrefix]
  );
  const textAlign = isRtl ? 'text-right' : 'text-left';
  const labelRow = cn('inline-flex w-full items-center gap-2', isRtl ? 'flex-row-reverse justify-end' : '');

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="relative h-56 overflow-hidden rounded-xl border bg-muted sm:h-64"
        style={{
          filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`,
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={HEADER_COVER_ASPECT}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={(_, areaPixels) => onCropComplete(areaPixels)}
          onCropAreaChange={(_, areaPixels) => onCropComplete(areaPixels)}
          objectFit="horizontal-cover"
        />
      </div>

      <div className={cn('space-y-2', textAlign)}>
        <Label className={labelRow}>{translate('zoom', 'Zoom')}</Label>
        <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(value) => onZoomChange(value[0] ?? 1)} />
      </div>

      <div className={cn('flex flex-wrap gap-2', isRtl ? 'justify-end' : 'justify-start')}>
        <Button type="button" variant="outline" size="sm" onClick={() => onRotationChange(rotation - 90)}>
          <RotateCcw className="h-4 w-4" />
          {translate('rotateLeft', 'Rotate left')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onRotationChange(rotation + 90)}>
          <RotateCw className="h-4 w-4" />
          {translate('rotateRight', 'Rotate right')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRotationChange(0)}>
          {translate('resetRotation', 'Reset rotation')}
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
        <p className={cn('text-sm font-medium', textAlign)}>{translate('effects', 'Effects')}</p>

        <div className={cn('space-y-2', textAlign)}>
          <Label className={labelRow}>
            <Sun className="h-4 w-4 shrink-0" />
            {translate('brightness', 'Brightness')}
          </Label>
          <Slider
            value={[filters.brightness]}
            min={50}
            max={150}
            step={1}
            onValueChange={(value) => onFiltersChange({ ...filters, brightness: value[0] ?? 100 })}
          />
        </div>

        <div className={cn('space-y-2', textAlign)}>
          <Label className={labelRow}>
            <Contrast className="h-4 w-4 shrink-0" />
            {translate('contrast', 'Contrast')}
          </Label>
          <Slider
            value={[filters.contrast]}
            min={50}
            max={150}
            step={1}
            onValueChange={(value) => onFiltersChange({ ...filters, contrast: value[0] ?? 100 })}
          />
        </div>

        <div className={cn('space-y-2', textAlign)}>
          <Label className={labelRow}>
            <Droplets className="h-4 w-4 shrink-0" />
            {translate('saturation', 'Saturation')}
          </Label>
          <Slider
            value={[filters.saturation]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => onFiltersChange({ ...filters, saturation: value[0] ?? 100 })}
          />
        </div>

        <div className={cn('flex', isRtl ? 'justify-end' : 'justify-start')}>
          <Button type="button" variant="ghost" size="sm" onClick={() => onFiltersChange(DEFAULT_HEADER_IMAGE_FILTERS)}>
            {translate('resetEffects', 'Reset effects')}
          </Button>
        </div>
      </div>
    </div>
  );
}
