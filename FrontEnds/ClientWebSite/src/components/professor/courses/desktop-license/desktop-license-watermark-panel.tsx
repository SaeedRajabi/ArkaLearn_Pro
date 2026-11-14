'use client';

import * as React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  WATERMARK_TOKENS,
  defaultWatermarkPolicy,
  previewWatermarkText,
  updateCourseWatermarkPolicy,
  watermarkPositionStyle,
  type CourseWatermarkPolicy,
  type WatermarkMovement,
  type WatermarkPosition,
} from '@/lib/api/desktop-licenses';

type Props = {
  courseId: number;
  courseTitle: string;
  isRtl: boolean;
  initialPolicy: CourseWatermarkPolicy | null;
  onSaved?: (policy: CourseWatermarkPolicy) => void;
};

const POSITION_OPTIONS: { value: WatermarkPosition; fa: string; en: string }[] = [
  { value: 0, fa: 'بالا چپ', en: 'Top left' },
  { value: 1, fa: 'بالا راست', en: 'Top right' },
  { value: 2, fa: 'پایین چپ', en: 'Bottom left' },
  { value: 3, fa: 'پایین راست', en: 'Bottom right' },
  { value: 4, fa: 'وسط', en: 'Center' },
];

export function DesktopLicenseWatermarkPanel({
  courseId,
  courseTitle,
  isRtl,
  initialPolicy,
  onSaved,
}: Props) {
  const [policy, setPolicy] = React.useState<CourseWatermarkPolicy>(
    initialPolicy ?? defaultWatermarkPolicy(courseId)
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setPolicy(initialPolicy ?? defaultWatermarkPolicy(courseId));
  }, [courseId, initialPolicy]);

  const previewText = previewWatermarkText(policy.textTemplate, {
    fullName: isRtl ? 'علی رضایی' : 'Ali Rezaei',
    email: 'student@example.com',
    phone: '09121234567',
    userName: 'ali.rezaei',
    courseTitle,
  });

  const insertToken = (token: string) => {
    setPolicy((prev) => ({
      ...prev,
      textTemplate: `${prev.textTemplate}${prev.textTemplate.endsWith(' ') || !prev.textTemplate ? '' : ' '}{${token}}`,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateCourseWatermarkPolicy({
        courseId,
        textTemplate: policy.textTemplate,
        fontSize: policy.fontSize,
        fontColor: policy.fontColor,
        opacity: policy.opacity,
        position: policy.position,
        rotationDeg: policy.rotationDeg,
        movement: policy.movement,
        paddingPx: policy.paddingPx,
      });
      setPolicy(result);
      setSaved(true);
      onSaved?.(result);
    } finally {
      setSaving(false);
    }
  };

  const posStyle = watermarkPositionStyle(policy.position, policy.paddingPx);
  const rotation = policy.rotationDeg;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={cn('space-y-4', isRtl && 'text-right')}>
        <Alert>
          <AlertDescription>
            {isRtl
              ? 'واترمارک لوگوی پلتفرم آرکا ثابت است و قابل حذف یا تغییر نیست.'
              : 'The Arka platform logo watermark is locked and cannot be removed or changed.'}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label>{isRtl ? 'قالب متن' : 'Text template'}</Label>
          <Textarea
            value={policy.textTemplate}
            onChange={(e) => {
              setPolicy((p) => ({ ...p, textTemplate: e.target.value }));
              setSaved(false);
            }}
            rows={3}
            dir="ltr"
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {WATERMARK_TOKENS.map((token) => (
              <Button key={token} type="button" size="sm" variant="secondary" onClick={() => insertToken(token)}>
                {`{${token}}`}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isRtl ? 'اندازه فونت' : 'Font size'}</Label>
            <Input
              type="number"
              min={8}
              max={72}
              value={policy.fontSize}
              onChange={(e) => {
                setPolicy((p) => ({ ...p, fontSize: Number(e.target.value) || 16 }));
                setSaved(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? 'رنگ فونت' : 'Font color'}</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={policy.fontColor}
                onChange={(e) => {
                  setPolicy((p) => ({ ...p, fontColor: e.target.value }));
                  setSaved(false);
                }}
                className="h-10 w-14 p-1"
              />
              <Input
                value={policy.fontColor}
                onChange={(e) => {
                  setPolicy((p) => ({ ...p, fontColor: e.target.value }));
                  setSaved(false);
                }}
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{isRtl ? 'شفافیت' : 'Opacity'} ({Math.round(policy.opacity * 100)}%)</Label>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={[policy.opacity]}
            onValueChange={([v]) => {
              setPolicy((p) => ({ ...p, opacity: v }));
              setSaved(false);
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isRtl ? 'موقعیت' : 'Position'}</Label>
            <Select
              value={String(policy.position)}
              onValueChange={(v) => {
                setPolicy((p) => ({ ...p, position: Number(v) as WatermarkPosition }));
                setSaved(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {isRtl ? opt.fa : opt.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? 'حرکت' : 'Movement'}</Label>
            <Select
              value={String(policy.movement)}
              onValueChange={(v) => {
                setPolicy((p) => ({ ...p, movement: Number(v) as WatermarkMovement }));
                setSaved(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{isRtl ? 'بدون حرکت' : 'None'}</SelectItem>
                <SelectItem value="1">{isRtl ? 'مورب' : 'Diagonal'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isRtl ? 'چرخش (درجه)' : 'Rotation (deg)'}</Label>
            <Input
              type="number"
              value={policy.rotationDeg}
              onChange={(e) => {
                setPolicy((p) => ({ ...p, rotationDeg: Number(e.target.value) || 0 }));
                setSaved(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? 'فاصله از لبه (px)' : 'Padding (px)'}</Label>
            <Input
              type="number"
              min={0}
              value={policy.paddingPx}
              onChange={(e) => {
                setPolicy((p) => ({ ...p, paddingPx: Number(e.target.value) || 0 }));
                setSaved(false);
              }}
            />
          </div>
        </div>

        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isRtl ? 'ذخیره واترمارک' : 'Save watermark'}
        </Button>
        {saved ? (
          <p className="text-sm text-emerald-600">{isRtl ? 'ذخیره شد.' : 'Saved.'}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label>{isRtl ? 'پیش‌نمایش زنده' : 'Live preview'}</Label>
        <div className="relative aspect-video overflow-hidden rounded-xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
            {isRtl ? 'پیش‌نمایش ویدیو' : 'Video preview'}
          </div>
          <Badge className="absolute bottom-3 start-3 bg-black/50 text-[10px]" variant="secondary">
            {isRtl ? 'لوگوی آرکا (قفل)' : 'Arka logo (locked)'}
          </Badge>
          <span
            className={cn(
              'pointer-events-none select-none whitespace-pre-wrap break-all px-1',
              policy.movement === 1 && 'animate-[watermark-drift_6s_ease-in-out_infinite]'
            )}
            style={{
              ...posStyle,
              color: policy.fontColor,
              fontSize: policy.fontSize,
              opacity: policy.opacity,
              transform:
                policy.position === 4
                  ? `${posStyle.transform ?? ''} rotate(${rotation}deg)`.trim()
                  : `rotate(${rotation}deg)`,
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              maxWidth: '85%',
            }}
          >
            {previewText}
          </span>
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html: `@keyframes watermark-drift { 0%, 100% { translate: 0 0; } 50% { translate: 24px -18px; } }`,
          }}
        />
      </div>
    </div>
  );
}
