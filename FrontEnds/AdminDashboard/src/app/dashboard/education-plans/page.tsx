'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import type { TrainingPlan } from '@/lib/types';
import { getTrainingPlans } from '@/services/training-plan-service';
import { PlansTable } from './components/plans-table';
import { PlanFormDialog } from './components/plan-form-dialog';

export default function EducationPlansPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (cacheBust = false) => {
    setLoading(true);
    try {
      const res = await getTrainingPlans(search, 1, 100, cacheBust);
      const list = res.queryResult.$values ?? [];
      setPlans(list);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('nav_education_plans')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('education_plan_page_description')}</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_plan_button')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t('search_plans_placeholder')}
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('loading')}</p>
      ) : (
        <PlansTable plans={plans} onRefresh={() => load(true)} />
      )}

      <PlanFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSaved={() => load(true)}
      />
    </div>
  );
}
