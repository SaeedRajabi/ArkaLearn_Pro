'use client';

import Link from 'next/link';
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getDictValue } from '@/lib/i18n-client';
import { getTeacherProfile, submitTeacherProfile } from '@/lib/api/teachers';
import type { Dictionary } from '@/types';

export function ProfessorSubmitPageContent({ dict }: { dict: Dictionary }) {
  const { user } = useAuth();
  const [status, setStatus] = React.useState<string>('draft');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.userName) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getTeacherProfile({ userName: user.userName, forEdit: true });
        if (!cancelled) setStatus(profile?.profileApprovalStatus ?? 'draft');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.userName]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await submitTeacherProfile(Number(user.id));
      setStatus('pending');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{getDictValue(dict, 'professorDashboard.submit.title', 'Submit for review')}</CardTitle>
        <CardDescription>
          {getDictValue(
            dict,
            'professorDashboard.submit.description',
            'After you save your profile, submit it here for admin approval.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {getDictValue(dict, 'professorDashboard.submit.currentStatus', 'Current status')}:{' '}
          <span className="font-medium text-foreground">{status}</span>
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {getDictValue(dict, 'professorDashboard.submit.button', 'Submit for approval')}
        </Button>
        <Button asChild variant="outline">
          <Link href="/professor/profile">
            {getDictValue(dict, 'professorDashboard.submit.backToProfile', 'Back to profile')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ProfessorSubmitPageClient({ dict }: { dict: Dictionary }) {
  return <ProfessorSubmitPageContent dict={dict} />;
}
