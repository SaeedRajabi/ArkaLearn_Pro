'use client';

import * as React from 'react';
import { Loader2, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { listMediaAssetOwners, type MediaAssetOwnerItem } from '@/services/media-api.service';
import { MediaLibraryModal } from './MediaLibraryModal';

export function MediaLibraryPageClient() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [owners, setOwners] = React.useState<MediaAssetOwnerItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedOwner, setSelectedOwner] = React.useState<MediaAssetOwnerItem | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMediaAssetOwners({
        search: search.trim() || undefined,
        page,
        pageSize: 10,
      });
      setOwners(result.items);
      setTotalCount(result.totalCount);
    } catch {
      toast({ title: t('media.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('media.pageTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('media.adminPageDescription')}</p>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-8"
            placeholder={t('media.searchUsersPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void load()}>
          {t('media.search')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {owners.map((owner) => (
            <button
              key={owner.ownerUserId}
              type="button"
              className="flex w-full items-center gap-4 p-4 text-start transition hover:bg-muted/50"
              onClick={() => {
                setSelectedOwner(owner);
                setModalOpen(true);
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{owner.ownerName || `#${owner.ownerUserId}`}</p>
                <p className="text-sm text-muted-foreground">
                  {t('media.fileCount').replace('{count}', String(owner.mediaCount))}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && owners.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t('media.noUsersWithMedia')}</p>
      ) : null}

      {totalCount > 10 ? (
        <div className="flex justify-center gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('media.prevPage')}
          </Button>
          <span className="self-center text-sm">{page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={page * 10 >= totalCount}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('media.nextPage')}
          </Button>
        </div>
      ) : null}

      {selectedOwner ? (
        <MediaLibraryModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode="manage"
          isAdmin
          ownerUserId={selectedOwner.ownerUserId}
          ownerName={selectedOwner.ownerName}
          key={selectedOwner.ownerUserId}
        />
      ) : null}
    </div>
  );
}
