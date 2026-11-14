
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useProfessorAdminLanguage } from './professor-admin-language-provider';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onInsertAction: (attrs: { src: string; style: string; alt?: string }) => void;
}

export function ImageEditorDialog({ open, onOpenChangeAction, onInsertAction }: ImageEditorDialogProps) {
  const { t } = useProfessorAdminLanguage();
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [width, setWidth] = useState(100);
  const [borderRadius, setBorderRadius] = useState(0);
  const [shadow, setShadow] = useState(0);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setImageUrl('');
      setPreviewUrl('');
      setAltText('');
      setWidth(100);
      setBorderRadius(0);
      setShadow(0);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setPreviewUrl(e.target.value);
  };

  const handleInsert = () => {
    if (!imageUrl) return;

    const styles: string[] = [];
    if (width < 100) styles.push(`width: ${width}%`);
    if (borderRadius > 0) styles.push(`border-radius: ${borderRadius}px`);
    if (shadow > 0) styles.push(`box-shadow: 0 0 ${shadow * 2}px rgba(0,0,0,0.5)`);
    
    onInsertAction({
      src: imageUrl,
      alt: altText,
      style: styles.join('; '),
    });
  };

  const imageStyle = {
    width: `${width}%`,
    borderRadius: `${borderRadius}px`,
    boxShadow: shadow > 0 ? `0 0 ${shadow * 2}px rgba(0,0,0,0.5)` : 'none',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{t('image_editor_title')}</DialogTitle>
          <DialogDescription>{t('image_editor_description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">{t('image_editor_upload_tab')}</TabsTrigger>
                <TabsTrigger value="url">{t('image_editor_url_tab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="picture">{t('image_editor_upload_label')}</Label>
                  <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" />
                </div>
              </TabsContent>
              <TabsContent value="url" className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">{t('image_editor_url_label')}</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={handleUrlChange}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="space-y-2">
                <Label htmlFor="alt-text">{t('image_editor_alt_text_label')}</Label>
                <Input id="alt-text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder={t('image_editor_alt_text_placeholder')} />
            </div>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('image_editor_width_label')}: {width}%</Label>
                <Slider value={[width]} onValueChange={(v) => setWidth(v[0])} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label>{t('image_editor_border_radius_label')}: {borderRadius}px</Label>
                <Slider value={[borderRadius]} onValueChange={(v) => setBorderRadius(v[0])} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label>{t('image_editor_shadow_label')}: {shadow}</Label>
                <Slider value={[shadow]} onValueChange={(v) => setShadow(v[0])} max={20} step={1} />
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-md p-4 flex items-center justify-center min-h-[300px]">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" style={imageStyle} />
            ) : (
              <p className="text-muted-foreground">{t('image_editor_preview_placeholder')}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleInsert} disabled={!imageUrl}>
            {t('image_editor_insert_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
