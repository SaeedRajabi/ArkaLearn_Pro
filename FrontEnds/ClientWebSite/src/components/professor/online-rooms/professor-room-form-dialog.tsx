'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  createProfessorRoom,
  getDefaultRoomBaseUrl,
  slugifyRoomTitle,
  updateProfessorRoom,
  type ProfessorRoomDetail,
} from '@/lib/api/professor-rooms';
import type { Dictionary } from '@/types';

type Props = {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: ProfessorRoomDetail | null;
  onSaved: (roomId: number) => void | Promise<void>;
};

export function ProfessorRoomFormDialog({ dict, open, onOpenChange, room, onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);
  const isEdit = Boolean(room?.roomId);

  const [saving, setSaving] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState(getDefaultRoomBaseUrl());
  const [capacity, setCapacity] = React.useState('10');
  const [maxSessionTime, setMaxSessionTime] = React.useState('120');
  const [status, setStatus] = React.useState('1');
  const [isGuest, setIsGuest] = React.useState(false);
  const [guestQuantity, setGuestQuantity] = React.useState(10);
  const [teacherEntersFirst, setTeacherEntersFirst] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    if (room) {
      setTitle(room.title ?? '');
      setSlug(room.slug ?? '');
      setBaseUrl(getDefaultRoomBaseUrl());
      setCapacity(String(room.capacity ?? 10));
      setMaxSessionTime(String(room.maxSessionTime ?? 120));
      setStatus(String(room.status ?? 1));
      setIsGuest(room.isGuest ?? false);
      setGuestQuantity(room.guestQuantity ?? 10);
      setTeacherEntersFirst(room.teacherEntersFirst ?? true);
    } else {
      setTitle('');
      setSlug('');
      setBaseUrl(getDefaultRoomBaseUrl());
      setCapacity('10');
      setMaxSessionTime('120');
      setStatus('1');
      setIsGuest(false);
      setGuestQuantity(10);
      setTeacherEntersFirst(true);
    }
  }, [open, room]);

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!isEdit && !slug.trim()) {
      setSlug(slugifyRoomTitle(value));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const userId = Number(user?.id);
    if (!userId || !title.trim() || !slug.trim()) return;

    const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!/^[a-z0-9-]+$/i.test(normalizedSlug)) {
      toast({
        title: t('professorDashboard.onlineRooms.slugInvalid', isRtl ? 'آدرس URL نامعتبر است' : 'Invalid URL slug'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && room) {
        await updateProfessorRoom({
          roomId: room.roomId,
          title: title.trim(),
          slug: normalizedSlug,
          baseUrl: baseUrl.trim() || getDefaultRoomBaseUrl(),
          roomCapacity: Number(capacity) || 10,
          isGuest,
          guestQuantity: isGuest ? guestQuantity : 0,
          status: Number(status),
          maxSessionTime: Number(maxSessionTime) || 120,
          teacherEntersFirst,
        });
        toast({
          title: t('professorDashboard.onlineRooms.roomUpdated', isRtl ? 'اتاق به‌روزرسانی شد' : 'Room updated'),
        });
        await onSaved(room.roomId);
      } else {
        const created = await createProfessorRoom({
          title: title.trim(),
          slug: normalizedSlug,
          baseUrl: baseUrl.trim() || getDefaultRoomBaseUrl(),
          roomCapacity: Number(capacity) || 10,
          isGuest,
          guestQuantity: isGuest ? guestQuantity : 0,
          firstAdminInput: false,
          teacherEntersFirst,
          status: Number(status),
          maxSessionTime: Number(maxSessionTime) || 120,
          userId,
        });
        toast({
          title: t('professorDashboard.onlineRooms.roomCreated', isRtl ? 'اتاق ایجاد شد' : 'Room created'),
          description: t(
            'professorDashboard.onlineRooms.roomCreatedHint',
            isRtl ? 'اکنون می‌توانید رسانه و اسلاید آپلود کنید.' : 'You can now upload media and slides.'
          ),
        });
        await onSaved(created.roomId);
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t(
          isEdit ? 'professorDashboard.onlineRooms.roomUpdateFailed' : 'professorDashboard.onlineRooms.roomCreateFailed',
          isEdit ? 'به‌روزرسانی انجام نشد' : 'Could not create room'
        ),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('professorDashboard.onlineRooms.editRoom', isRtl ? 'ویرایش اتاق' : 'Edit room')
              : t('professorDashboard.onlineRooms.addRoom', isRtl ? 'اتاق جدید' : 'New room')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'professorDashboard.onlineRooms.roomFormHint',
              isRtl ? 'اتاق آنلاین برای برگزاری جلسات خصوصی با دانشجو.' : 'Online room for private sessions with students.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('professorDashboard.onlineRooms.roomTitle', isRtl ? 'عنوان اتاق' : 'Room title')}</Label>
            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>{t('professorDashboard.onlineRooms.slugLabel', isRtl ? 'بخش URL (slug)' : 'URL slug')}</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="my-private-room"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('professorDashboard.onlineRooms.slugHint', isRtl ? 'فقط حروف انگلیسی، عدد و خط تیره' : 'Letters, numbers, and hyphens only')}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t('professorDashboard.onlineRooms.baseUrl', isRtl ? 'URL پایه' : 'Base URL')}</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={getDefaultRoomBaseUrl()} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('professorDashboard.onlineRooms.capacity', isRtl ? 'ظرفیت اتاق' : 'Room capacity')}</Label>
              <Input type="number" min={1} max={500} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.onlineRooms.sessionTime', isRtl ? 'مدت جلسه (دقیقه)' : 'Session time (min)')}</Label>
              <Input
                type="number"
                min={1}
                max={480}
                value={maxSessionTime}
                onChange={(e) => setMaxSessionTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('professorDashboard.onlineRooms.statusLabel', isRtl ? 'وضعیت اتاق' : 'Room status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('professorDashboard.onlineRooms.statusActive', isRtl ? 'فعال' : 'Active')}</SelectItem>
                <SelectItem value="2">{t('professorDashboard.onlineRooms.statusInactive', isRtl ? 'غیرفعال' : 'Inactive')}</SelectItem>
                <SelectItem value="3">{t('professorDashboard.onlineRooms.statusSuspended', isRtl ? 'معلق' : 'Suspended')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pe-4">
              <Label>{t('professorDashboard.onlineRooms.guestAccess', isRtl ? 'دسترسی میهمان' : 'Guest access')}</Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.onlineRooms.guestAccessHint',
                  isRtl ? 'اجازه ورود مهمان بدون حساب ثابت' : 'Allow guests without a fixed account'
                )}
              </p>
            </div>
            <Switch checked={isGuest} onCheckedChange={setIsGuest} />
          </div>

          {isGuest ? (
            <div className="space-y-2 rounded-lg border p-4">
              <Label>
                {t('professorDashboard.onlineRooms.guestQuantity', isRtl ? 'تعداد میهمان' : 'Guest count')}: {guestQuantity}
              </Label>
              <Slider value={[guestQuantity]} min={1} max={200} step={1} onValueChange={(v) => setGuestQuantity(v[0] ?? 1)} />
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pe-4">
              <Label>
                {t('professorDashboard.onlineRooms.teacherEntersFirst', isRtl ? 'ابتدا استاد وارد شود' : 'Teacher enters first')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.onlineRooms.teacherEntersFirstHint',
                  isRtl
                    ? 'در صورت فعال بودن، دانشجو تا ورود استاد منتظر می‌ماند.'
                    : 'When enabled, students wait until the teacher joins.'
                )}
              </p>
            </div>
            <Switch checked={teacherEntersFirst} onCheckedChange={setTeacherEntersFirst} />
          </div>

          {!isEdit ? (
            <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              {t(
                'professorDashboard.onlineRooms.filesAfterCreate',
                isRtl
                  ? 'پس از ایجاد اتاق، می‌توانید ویدیو، صوت، اسلاید و فایل‌های آموزشی را آپلود کنید.'
                  : 'After creating the room, you can upload videos, audio, slides, and teaching files.'
              )}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('professorDashboard.educationPlans.cancel', isRtl ? 'انصراف' : 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.educationPlans.save', isRtl ? 'ذخیره' : 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
