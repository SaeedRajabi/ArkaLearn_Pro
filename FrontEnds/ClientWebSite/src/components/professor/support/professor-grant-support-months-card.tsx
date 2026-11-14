'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { grantStudentSupportMonths } from '@/lib/api/support-subscription';
import { getDictValue } from '@/lib/i18n-client';
import { isValidLongId } from '@/lib/id';
import type { Dictionary } from '@/types';

export const PROFESSOR_MAX_GRANT_MONTHS = 5;

type Props = {
  dict: Dictionary;
  studentUserId: string;
  studentName?: string | null;
};

export function ProfessorGrantSupportMonthsCard({ dict, studentUserId, studentName }: Props) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const { toast } = useToast();
  const [months, setMonths] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  const handleGrant = async () => {
    if (!isValidLongId(studentUserId)) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.grantFailed', 'Could not grant support time'),
      });
      return;
    }

    if (months < 1 || months > PROFESSOR_MAX_GRANT_MONTHS) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.grantMonthsMax', 'You can grant at most {months} months.')
          .replace('{months}', String(PROFESSOR_MAX_GRANT_MONTHS)),
      });
      return;
    }

    setSubmitting(true);
    try {
      await grantStudentSupportMonths({
        studentUserId,
        months,
      });
      toast({ title: t('supportSubscription.grantSuccess', 'Support time granted') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('supportSubscription.grantFailed', 'Could not grant support time'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {t('supportSubscription.grantTitle', 'Grant free support months')}
        </CardTitle>
        <CardDescription>
          {studentName
            ? t('supportSubscription.grantDescNamed', 'Add support months for {name}.').replace('{name}', studentName)
            : t('supportSubscription.grantDesc', 'Add free online support months for this student.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>{t('supportSubscription.grantMonths', 'Months')}</Label>
          <Input
            type="number"
            min={1}
            max={PROFESSOR_MAX_GRANT_MONTHS}
            className="w-28"
            value={months}
            onChange={(event) => {
              const next = Number(event.target.value) || 1;
              setMonths(Math.min(PROFESSOR_MAX_GRANT_MONTHS, Math.max(1, next)));
            }}
          />
          <p className="text-xs text-muted-foreground">
            {t('supportSubscription.grantMonthsMaxHint', 'Maximum {months} months per grant.').replace(
              '{months}',
              String(PROFESSOR_MAX_GRANT_MONTHS)
            )}
          </p>
        </div>
        <Button variant="secondary" disabled={submitting} onClick={() => void handleGrant()}>
          {t('supportSubscription.grantSubmit', 'Grant months')}
        </Button>
      </CardContent>
    </Card>
  );
}
