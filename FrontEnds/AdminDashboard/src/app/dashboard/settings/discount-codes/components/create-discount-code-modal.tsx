'use client';

import * as React from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  createDiscountCode,
  type DiscountScopeType,
  type DiscountTypeValue,
} from '@/services/discount-codes-api.service';
import { getCourses } from '@/services/course-service';
import { searchAdminTeachers } from '@/services/admin-teachers-api.service';
import { searchPortalStudents } from '@/services/portal-students-api.service';
import { unwrapApiList } from '@/lib/api/normalize-list';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSaved?: () => void;
};

type PickedItem = { id: string; label: string };

export function CreateDiscountCodeModal({ open, onOpenChangeAction, onSaved }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [code, setCode] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [amount, setAmount] = React.useState('10');
  const [discountType, setDiscountType] = React.useState<DiscountTypeValue>(2);
  const [usageLimit, setUsageLimit] = React.useState('0');
  const [durationValue, setDurationValue] = React.useState('7');
  const [durationUnit, setDurationUnit] = React.useState<'hours' | 'days' | 'months'>('days');
  const [scopeType, setScopeType] = React.useState<DiscountScopeType>(0);

  const [selectedCourses, setSelectedCourses] = React.useState<PickedItem[]>([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState<PickedItem | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<PickedItem | null>(null);

  const [courseQuery, setCourseQuery] = React.useState('');
  const [teacherQuery, setTeacherQuery] = React.useState('');
  const [studentQuery, setStudentQuery] = React.useState('');
  const [courseOptions, setCourseOptions] = React.useState<PickedItem[]>([]);
  const [teacherOptions, setTeacherOptions] = React.useState<PickedItem[]>([]);
  const [studentOptions, setStudentOptions] = React.useState<PickedItem[]>([]);
  const [searching, setSearching] = React.useState(false);

  const reset = React.useCallback(() => {
    setCode('');
    setTitle('');
    setAmount('10');
    setDiscountType(2);
    setUsageLimit('0');
    setDurationValue('7');
    setDurationUnit('days');
    setScopeType(0);
    setSelectedCourses([]);
    setSelectedTeacher(null);
    setSelectedStudent(null);
    setCourseQuery('');
    setTeacherQuery('');
    setStudentQuery('');
    setCourseOptions([]);
    setTeacherOptions([]);
    setStudentOptions([]);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  React.useEffect(() => {
    if (!open || (scopeType !== 1 && scopeType !== 3)) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const raw = await getCourses(courseQuery, 1, 8);
        const list =
          (raw?.queryResult as { $values?: Record<string, unknown>[] })?.$values ??
          unwrapApiList<Record<string, unknown>>(raw?.queryResult ?? raw);
        setCourseOptions(
          list
            .map((c) => ({
              id: String(c.id ?? c.Id ?? c.courseId ?? c.CourseId ?? ''),
              label: String(c.title ?? c.Title ?? c.courseName ?? c.CourseName ?? ''),
            }))
            .filter((x) => x.id && x.id !== '0')
        );
      } catch {
        setCourseOptions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [courseQuery, open, scopeType]);

  React.useEffect(() => {
    if (!open || scopeType !== 2) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchAdminTeachers({ inputValue: teacherQuery, pageNumber: 1, pageSize: 8 });
        setTeacherOptions(
          res.items.map((x) => ({
            id: String(x.teacherId),
            label: x.displayName || x.userName || String(x.teacherId),
          }))
        );
      } catch {
        setTeacherOptions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [teacherQuery, open, scopeType]);

  React.useEffect(() => {
    if (!open || scopeType !== 3) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPortalStudents({ inputValue: studentQuery, pageNumber: 1, pageSize: 8 });
        setStudentOptions(
          res.items.map((x) => ({
            id: x.userId,
            label: x.fullName || x.userName || x.email || x.userId,
          }))
        );
      } catch {
        setStudentOptions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [studentQuery, open, scopeType]);

  const handleSave = async () => {
    const normalizedCode = code.trim().toUpperCase();
    const parsedAmount = Number(amount);
    const parsedUsage = Number(usageLimit);
    const parsedDuration = Number(durationValue);

    if (normalizedCode.length < 4) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_code') });
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_amount') });
      return;
    }
    if (discountType === 2 && parsedAmount > 100) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_percent') });
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_duration') });
      return;
    }
    if ((scopeType === 1 || scopeType === 3) && selectedCourses.length === 0) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_courses') });
      return;
    }
    if (scopeType === 2 && !selectedTeacher) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_teacher') });
      return;
    }
    if (scopeType === 3 && !selectedStudent) {
      toast({ variant: 'destructive', title: t('discount_codes_validation_student') });
      return;
    }

    setSaving(true);
    try {
      const result = await createDiscountCode({
        code: normalizedCode,
        title: title.trim() || null,
        amount: parsedAmount,
        discountType,
        durationValue: parsedDuration,
        durationUnit,
        usageLimit: Number.isFinite(parsedUsage) && parsedUsage >= 0 ? parsedUsage : 0,
        scopeType,
        courseIds: selectedCourses.map((c) => c.id),
        teacherId: selectedTeacher?.id ?? null,
        studentUserId: selectedStudent?.id ?? null,
      });

      if (!result.ok) {
        toast({
          variant: 'destructive',
          title: t('discount_codes_create_error_title'),
          description: result.message || t('discount_codes_create_error_desc'),
        });
        return;
      }

      toast({
        title: t('discount_codes_create_success_title'),
        description: t('discount_codes_create_success_desc'),
      });
      onOpenChangeAction(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('discount_codes_create_title')}</DialogTitle>
          <DialogDescription>{t('discount_codes_create_description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="dc-code">{t('discount_codes_field_code')}</Label>
            <Input
              id="dc-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="OFF20"
              maxLength={32}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dc-title">{t('discount_codes_field_title')}</Label>
            <Input id="dc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t('discount_codes_field_type')}</Label>
              <Select
                value={String(discountType)}
                onValueChange={(v) => setDiscountType(Number(v) as DiscountTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">{t('discount_codes_type_percent')}</SelectItem>
                  <SelectItem value="1">{t('discount_codes_type_fixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dc-amount">{t('discount_codes_field_amount')}</Label>
              <Input
                id="dc-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="dc-duration">{t('discount_codes_field_duration')}</Label>
              <Input
                id="dc-duration"
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('discount_codes_field_duration_unit')}</Label>
              <Select
                value={durationUnit}
                onValueChange={(v) => setDurationUnit(v as 'hours' | 'days' | 'months')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">{t('discount_codes_unit_hours')}</SelectItem>
                  <SelectItem value="days">{t('discount_codes_unit_days')}</SelectItem>
                  <SelectItem value="months">{t('discount_codes_unit_months')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dc-usage">{t('discount_codes_field_usage')}</Label>
            <Input
              id="dc-usage"
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('discount_codes_usage_hint')}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t('discount_codes_field_scope')}</Label>
            <Select
              value={String(scopeType)}
              onValueChange={(v) => {
                const next = Number(v) as DiscountScopeType;
                setScopeType(next);
                setSelectedCourses([]);
                setSelectedTeacher(null);
                setSelectedStudent(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('discount_codes_scope_all_courses')}</SelectItem>
                <SelectItem value="1">{t('discount_codes_scope_courses')}</SelectItem>
                <SelectItem value="2">{t('discount_codes_scope_teacher')}</SelectItem>
                <SelectItem value="3">{t('discount_codes_scope_student')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(scopeType === 1 || scopeType === 3) && (
            <div className="grid gap-2">
              <Label>{t('discount_codes_pick_courses')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                  placeholder={t('discount_codes_search_courses')}
                />
              </div>
              {searching ? <p className="text-xs text-muted-foreground">...</p> : null}
              <div className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                {courseOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="rounded px-2 py-1 text-start text-sm hover:bg-muted"
                    onClick={() => {
                      setSelectedCourses((prev) =>
                        prev.some((x) => x.id === opt.id) ? prev : [...prev, opt]
                      );
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCourses.map((c) => (
                  <Badge key={c.id} variant="secondary" className="gap-1">
                    {c.label}
                    <button type="button" onClick={() => setSelectedCourses((p) => p.filter((x) => x.id !== c.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {scopeType === 2 && (
            <div className="grid gap-2">
              <Label>{t('discount_codes_pick_teacher')}</Label>
              <Input
                value={teacherQuery}
                onChange={(e) => setTeacherQuery(e.target.value)}
                placeholder={t('discount_codes_search_teachers')}
              />
              <div className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                {teacherOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="rounded px-2 py-1 text-start text-sm hover:bg-muted"
                    onClick={() => setSelectedTeacher(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {selectedTeacher ? (
                <Badge variant="secondary" className="w-fit gap-1">
                  {selectedTeacher.label}
                  <button type="button" onClick={() => setSelectedTeacher(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
            </div>
          )}

          {scopeType === 3 && (
            <div className="grid gap-2">
              <Label>{t('discount_codes_pick_student')}</Label>
              <Input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder={t('discount_codes_search_students')}
              />
              <div className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-md border p-2">
                {studentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="rounded px-2 py-1 text-start text-sm hover:bg-muted"
                    onClick={() => setSelectedStudent(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {selectedStudent ? (
                <Badge variant="secondary" className="w-fit gap-1">
                  {selectedStudent.label}
                  <button type="button" onClick={() => setSelectedStudent(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChangeAction(false)} disabled={saving}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('discount_codes_create_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
