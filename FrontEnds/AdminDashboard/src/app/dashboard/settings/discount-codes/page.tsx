'use client';

import * as React from 'react';
import { PlusCircle, Search, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { RoleGuard } from '@/components/role-guard';
import { DiscountCodesTable } from './components/discount-codes-table';
import { CreateDiscountCodeModal } from './components/create-discount-code-modal';
import type { DiscountScopeType } from '@/services/discount-codes-api.service';

export default function DiscountCodesPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [scopeFilter, setScopeFilter] = React.useState<string>('all');
  const [activeFilter, setActiveFilter] = React.useState<string>('all');
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const scopeType: DiscountScopeType | null =
    scopeFilter === 'all' ? null : (Number(scopeFilter) as DiscountScopeType);
  const isActive: boolean | null =
    activeFilter === 'all' ? null : activeFilter === 'active';

  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="space-y-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TicketPercent className="h-7 w-7 text-primary" />
              {t('discount_codes_page_title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('discount_codes_page_description')}</p>
          </div>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('discount_codes_create_button')}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('discount_codes_search_placeholder')}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('discount_codes_filter_scope')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('discount_codes_scope_all_filter')}</SelectItem>
              <SelectItem value="0">{t('discount_codes_scope_all_courses')}</SelectItem>
              <SelectItem value="1">{t('discount_codes_scope_courses')}</SelectItem>
              <SelectItem value="2">{t('discount_codes_scope_teacher')}</SelectItem>
              <SelectItem value="3">{t('discount_codes_scope_student')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('discount_codes_filter_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('discount_codes_status_all')}</SelectItem>
              <SelectItem value="active">{t('discount_codes_status_active')}</SelectItem>
              <SelectItem value="inactive">{t('discount_codes_status_inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DiscountCodesTable
          searchTerm={debouncedSearch}
          scopeType={scopeType}
          isActive={isActive}
          reloadKey={reloadKey}
        />

        <CreateDiscountCodeModal
          open={isModalOpen}
          onOpenChangeAction={setIsModalOpen}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      </div>
    </RoleGuard>
  );
}
