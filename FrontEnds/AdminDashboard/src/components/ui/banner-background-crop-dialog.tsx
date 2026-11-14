'use client';

import 'react-easy-crop/react-easy-crop.css';
import * as React from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/components/language-provider';
import {
  BANNER_COVER_ASPECT,
  getCroppedBannerImageBlob,
  validateBannerImageFile,
} from '@/lib/utils/banner-background-crop';

type BannerBackgroundCropDialogProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  imageSrc: string;
  onConfirmAction: (file: File) => void;
};

export function BannerBackgroundCropDialog({
  open,
  onOpenChangeAction,
  imageSrc,
  onConfirmAction,
}: BannerBackgroundCropDialogProps) {
  const { t } = useLanguage();
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBannerImageBlob(imageSrc, croppedAreaPixels, rotation);
      const file = new File([blob], `site-announcement-bg-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const validationError = validateBannerImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }
      onConfirmAction(file);
      onOpenChangeAction(false);
    } catch {
      // Parent toast handles errors if needed
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('site_announcement_crop_title')}</DialogTitle>
          <DialogDescription>{t('site_announcement_crop_description')}</DialogDescription>
        </DialogHeader>

        <div className="relative h-48 overflow-hidden rounded-xl border bg-muted sm:h-56">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={BANNER_COVER_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            objectFit="horizontal-cover"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('site_announcement_crop_zoom')}</Label>
            <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={([v]) => setZoom(v)} />
          </div>
          <div className="space-y-2">
            <Label>{t('site_announcement_crop_rotation')}</Label>
            <Slider min={0} max={360} step={1} value={[rotation]} onValueChange={([v]) => setRotation(v)} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={!croppedAreaPixels || processing}>
            {processing ? t('saving') : t('site_announcement_crop_apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
