'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type Props = { attemptId: number };

export function StudentExamResultRedirect({ attemptId }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/account?view=my-exams&showResult=${attemptId}`);
  }, [attemptId, router]);

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
