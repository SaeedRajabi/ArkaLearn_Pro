'use client';

import * as React from 'react';
import { Ban, Loader2, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { SettingsFormError, SettingsFormLoading } from '@/components/settings/settings-form-states';
import {
  blockDesktopDevice,
  blockDesktopUserAccess,
  getDesktopAccessBlocks,
  getDesktopDevices,
  unblockDesktopDevice,
  unblockDesktopUserAccess,
  type DesktopAccessBlockRow,
  type DesktopDeviceRow,
} from '@/services/desktop-devices-api.service';
import {toPersianDigits} from "@/lib/utils/format/digits";

export function DesktopDevicesForm() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [filterUserId, setFilterUserId] = React.useState('');
  const [devices, setDevices] = React.useState<DesktopDeviceRow[]>([]);
  const [blocks, setBlocks] = React.useState<DesktopAccessBlockRow[]>([]);
  const [blockUserId, setBlockUserId] = React.useState('');
  const [blockScope, setBlockScope] = React.useState('1');
  const [blockReason, setBlockReason] = React.useState('');
  const isRtl = locale === 'fa';
  const fmt = (value: string | number) => (isRtl ? toPersianDigits(value) : String(value));

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const userId = filterUserId.trim() ? Number(filterUserId) : undefined;
      const [deviceRows, blockRows] = await Promise.all([
        getDesktopDevices(userId),
        getDesktopAccessBlocks(userId),
      ]);
      setDevices(deviceRows);
      setBlocks(blockRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('desktop_devices_load_failed');
      setLoadError(message);
      setDevices([]);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [filterUserId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  const runAction = async (action: () => Promise<void>, successKey: string, failKey: string) => {
    setSaving(true);
    try {
      await action();
      await load();
      toast({ title: t(successKey) });
    } catch (err) {
      toast({
        title: t(failKey),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBlockUser = async () => {
    const userId = Number(blockUserId);
    if (!Number.isFinite(userId) || userId <= 0) {
      toast({ title: t('desktop_devices_user_id_required'), variant: 'destructive' });
      return;
    }
    await runAction(
      () => blockDesktopUserAccess({ userId, scope: Number(blockScope), reason: blockReason || undefined }),
      'desktop_devices_block_user_success',
      'desktop_devices_block_user_failed'
    );
  };

  if (loading) {
    return (
      <SettingsFormLoading
        title={t('desktop_devices_registered_title')}
        description={t('desktop_devices_loading')}
      />
    );
  }
  if (loadError) {
    return (
      <SettingsFormError
        title={t('desktop_devices_registered_title')}
        message={loadError}
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('desktop_devices_filter_title')}</CardTitle>
          <CardDescription>{t('desktop_devices_filter_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="filter-user-id">{t('desktop_devices_user_id')}</Label>
            <Input
              id="filter-user-id"
              inputMode="numeric"
              placeholder="123"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={() => void load()} disabled={saving}>
            {t('desktop_devices_apply_filter')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('desktop_devices_block_user_title')}</CardTitle>
          <CardDescription>{t('desktop_devices_block_user_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('desktop_devices_user_id')}</Label>
            <Input value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)} inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label>{t('desktop_devices_block_scope')}</Label>
            <Select value={blockScope} onValueChange={setBlockScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('desktop_devices_scope_entire_app')}</SelectItem>
                <SelectItem value="0">{t('desktop_devices_scope_videos_only')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>{t('desktop_devices_block_reason')}</Label>
            <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Button onClick={() => void handleBlockUser()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              {t('desktop_devices_block_user_button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('desktop_devices_active_blocks')}</CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('desktop_devices_no_blocks')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead align={"right"}>{t('desktop_devices_user_id')}</TableHead>
                  <TableHead>{t('desktop_devices_block_scope')}</TableHead>
                  <TableHead>{t('desktop_devices_block_reason')}</TableHead>
                  <TableHead className="text-end">{t('desktop_release_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.userId}</TableCell>
                    <TableCell>
                      {row.scope === 1 ? t('desktop_devices_scope_entire_app') : t('desktop_devices_scope_videos_only')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{row.reason ?? '—'}</TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={saving}
                        onClick={() =>
                          void runAction(
                            () => unblockDesktopUserAccess(row.id),
                            'desktop_devices_unblock_user_success',
                            'desktop_devices_unblock_user_failed'
                          )
                        }
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        {t('desktop_devices_unblock_user_button')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('desktop_devices_registered_title')}</CardTitle>
          <CardDescription>{t('desktop_devices_registered_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('desktop_devices_empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('desktop_devices_user_id')}</TableHead>
                  <TableHead>{t('desktop_devices_device_id')}</TableHead>
                  <TableHead>{t('desktop_devices_machine')}</TableHead>
                  <TableHead>{t('desktop_devices_last_seen')}</TableHead>
                  <TableHead>{t('desktop_release_status')}</TableHead>
                  <TableHead className="text-center">{t('desktop_release_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{fmt(row.userId)}</TableCell>
                    <TableCell className="max-w-[10rem] truncate font-mono text-xs" dir="ltr">
                      {row.deviceId}
                    </TableCell>
                    <TableCell>{row.machineName ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(row.lastHeartbeatAtUtc)}
                    </TableCell>
                    <TableCell>
                      {row.isBlocked ? (
                        <Badge variant="destructive">{t('desktop_devices_blocked')}</Badge>
                      ) : (
                        <Badge>{t('desktop_devices_active')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {row.isBlocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() =>
                            void runAction(
                              () => unblockDesktopDevice(row.id),
                              'desktop_devices_unblock_device_success',
                              'desktop_devices_unblock_device_failed'
                            )
                          }
                        >
                          {t('desktop_devices_unblock_device_button')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() =>
                            void runAction(
                              () => blockDesktopDevice(row.id),
                              'desktop_devices_block_device_success',
                              'desktop_devices_block_device_failed'
                            )
                          }
                        >
                          {t('desktop_devices_block_device_button')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
