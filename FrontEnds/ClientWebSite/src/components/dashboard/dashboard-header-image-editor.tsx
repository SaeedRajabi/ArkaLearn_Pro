'use client';

import * as React from 'react';
import type { Area } from 'react-easy-crop';
import { Camera, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { uploadHeaderImage } from '@/lib/api/account';
import { getApiErrorMessage } from '@/lib/api/client';
import { getDashboardHeaderImageUrl } from '@/lib/utils/image-url';
import {
  DEFAULT_HEADER_IMAGE_FILTERS,
  getCroppedHeaderImageBlob,
  HEADER_MIN_HEIGHT,
  HEADER_MIN_WIDTH,
  readImageDimensions,
  validateHeaderImageDimensions,
  validateHeaderImageFile,
  type HeaderImageFilters,
} from '@/lib/utils/header-image-editor';
import { useProfessorDict } from '@/lib/use-professor-dict';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import type { Dictionary } from '@/types';
import { HeaderImageCropEditor } from '@/components/professor/dashboard/header-image-crop-editor';

type Step = 'select' | 'edit';

type DashboardHeaderImageEditorProps = {
  dict: Dictionary;
  translationPrefix: string;
  currentHeaderPath?: string | null;
  onSave: (headerImagePath: string) => Promise<void>;
  triggerClassName?: string;
  fileInputId?: string;
};

export function DashboardHeaderImageEditor({
  dict,
  translationPrefix,
  currentHeaderPath,
  onSave,
  triggerClassName,
  fileInputId = 'dashboard-header-image-file',
}: DashboardHeaderImageEditorProps) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const t = useProfessorDict(dict);
  const translate = React.useCallback(
    (suffix: string, fallback: string) => t(`${translationPrefix}.${suffix}`, fallback),
    [t, translationPrefix]
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>('select');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [filters, setFilters] = React.useState<HeaderImageFilters>(DEFAULT_HEADER_IMAGE_FILTERS);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);

  const currentCover = getDashboardHeaderImageUrl(currentHeaderPath);

  const resolveValidationMessage = React.useCallback(
    (code: string | null): string | null => {
      if (!code) return null;
      return translate(`errors.${code}`, translate('saveError', 'Invalid image.'));
    },
    [translate]
  );

  const resetEditor = React.useCallback(() => {
    setStep('select');
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFilters(DEFAULT_HEADER_IMAGE_FILTERS);
    setCroppedAreaPixels(null);
    if (imageSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [imageSrc]);

  React.useEffect(() => {
    if (!open) {
      resetEditor();
    }
  }, [open, resetEditor]);

  React.useEffect(() => {
    return () => {
      if (imageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileError = validateHeaderImageFile(file);
    if (fileError) {
      setError(resolveValidationMessage(fileError));
      event.target.value = '';
      return;
    }

    try {
      const { width, height, objectUrl } = await readImageDimensions(file);
      const dimensionError = validateHeaderImageDimensions(width, height);
      if (dimensionError) {
        URL.revokeObjectURL(objectUrl);
        setError(resolveValidationMessage(dimensionError));
        event.target.value = '';
        return;
      }

      if (imageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }

      setImageSrc(objectUrl);
      setStep('edit');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setFilters(DEFAULT_HEADER_IMAGE_FILTERS);
      setCroppedAreaPixels(null);
    } catch {
      setError(resolveValidationMessage('loadFailed'));
    } finally {
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError(resolveValidationMessage('cropRequired'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedHeaderImageBlob(imageSrc, croppedAreaPixels, rotation, filters);
      const file = new File([blob], 'dashboard-header.jpg', { type: 'image/jpeg' });
      const imagePath = await uploadHeaderImage(file, { returnRelativePath: true });
      await onSave(imagePath);
      setOpen(false);
    } catch (err) {
      const apiMessage = getApiErrorMessage(err, '');
      setError(apiMessage || translate('saveError', 'Could not save header image.'));
    } finally {
      setSaving(false);
    }
  };

  const textAlign = isRtl ? 'text-right' : 'text-left';
  const footerAlign = isRtl ? 'sm:flex-row-reverse sm:justify-start' : 'sm:justify-end';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            'absolute end-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/60'
          }
        >
          <Camera className="h-4 w-4" />
          {translate('change', 'Change cover')}
        </button>
      </DialogTrigger>

      <DialogContent dir={dir} className={cn('max-h-[92vh] overflow-y-auto sm:max-w-2xl', textAlign)}>
        <DialogHeader className={cn(textAlign, isRtl && 'items-end sm:text-right')}>
          <DialogTitle className={textAlign}>{translate('title', 'Dashboard cover')}</DialogTitle>
          <DialogDescription className={textAlign}>
            {translate(
              'description',
              'Choose an image from your device, crop it, and adjust it for your dashboard banner.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentCover && step === 'select' ? (
            <div
              className="dashboard-header-banner dashboard-header-banner--preview h-28 overflow-hidden rounded-xl border"
              style={{ backgroundImage: `url(${currentCover})` }}
            />
          ) : null}

          {step === 'select' ? (
            <div className="space-y-4 rounded-xl border border-dashed p-5">
              <p className={cn('text-sm text-muted-foreground', textAlign)}>
                {translate(
                  'requirements',
                  `Use a horizontal image at least ${HEADER_MIN_WIDTH}×${HEADER_MIN_HEIGHT} pixels (JPG, PNG, or WebP, up to 8 MB).`
                )}
              </p>

              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void handleFileSelect(e)}
              />

              <div className={cn('flex', isRtl ? 'justify-end' : 'justify-start')}>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {translate('chooseFile', 'Choose image from device')}
                </Button>
              </div>
            </div>
          ) : (
            imageSrc && (
              <HeaderImageCropEditor
                dict={dict}
                translationPrefix={translationPrefix}
                imageSrc={imageSrc}
                isRtl={isRtl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                filters={filters}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onFiltersChange={setFilters}
                onCropComplete={setCroppedAreaPixels}
              />
            )
          )}

          {error ? <p className={cn('text-sm text-destructive', textAlign)}>{error}</p> : null}
        </div>

        <DialogFooter className={cn('gap-2 sm:gap-3', footerAlign)}>
          {step === 'edit' ? (
            <Button type="button" variant="ghost" onClick={() => setStep('select')}>
              {translate('back', 'Choose another image')}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {translate('cancel', 'Cancel')}
          </Button>
          {step === 'edit' ? (
            <Button type="button" disabled={saving || !croppedAreaPixels} onClick={() => void handleSave()}>
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {translate('save', 'Save cover')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
