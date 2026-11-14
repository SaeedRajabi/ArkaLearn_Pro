'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { adminAssignStudentsToTeacher } from '@/services/admin-user-management-api.service';
import { getCourses } from '@/services/course-service';
import type { Course } from '@/lib/types';
import { searchPortalStudents, type PortalStudentRow } from '@/services/portal-students-api.service';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export function AssignStudentsToTeacherModal({
  open,
  onOpenChange,
  teacherUserId,
  teacherName,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherUserId: string | null;
  teacherName: string;
  onAssigned?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [courseId, setCourseId] = React.useState('');
  const [studentSearch, setStudentSearch] = React.useState('');
  const [students, setStudents] = React.useState<PortalStudentRow[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open || !teacherUserId) return;
    let cancelled = false;
    setLoading(true);
    setSelected(new Set());
    setCourseId('');
    void (async () => {
      try {
        const res = await getCourses('', 1, 200, 0, false);
        const list = (res?.queryResult as { $values?: Course[] })?.$values ?? [];
        const filtered = list.filter((c) => String(c.instructorId) === String(teacherUserId));
        if (!cancelled) setCourses(filtered);
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, teacherUserId]);

  React.useEffect(() => {
    if (!open) return;
    const tmr = window.setTimeout(() => {
      void searchPortalStudents({ inputValue: studentSearch.trim(), pageNumber: 1, pageSize: 20 }).then((res) =>
        setStudents(res.items)
      );
    }, 400);
    return () => window.clearTimeout(tmr);
  }, [open, studentSearch]);

  const handleSave = async () => {
    if (!teacherUserId || !courseId) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('assign_students_course_required') });
      return;
    }
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('assign_students_none_selected') });
      return;
    }
    setBusy(true);
    try {
      const result = await adminAssignStudentsToTeacher({
        teacherUserId,
        studentUserIds: ids,
        courseId: Number(courseId),
      });
      toast({
        title: t('assign_students_success_title'),
        description: t('assign_students_success_desc')
          .replace('{enrolled}', String(result.enrolledCount))
          .replace('{skipped}', String(result.skippedCount)),
      });
      onOpenChange(false);
      onAssigned?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('assign_students_failed'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('assign_students_title')}</DialogTitle>
          <DialogDescription>{t('assign_students_description').replace('{name}', teacherName)}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('assign_students_course_label')}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('assign_students_course_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('assign_students_search_label')}</Label>
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={t('portal_students_search_placeholder')}
              />
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
              {students.map((s) => (
                <div key={s.userId} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.has(s.userId)}
                    onCheckedChange={(v) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (v === true) next.add(s.userId);
                        else next.delete(s.userId);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm">{s.fullName || s.userName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('assign_students_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
