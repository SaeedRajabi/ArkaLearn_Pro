/** Shared helpers for course installment sale form (admin). */

export type CourseInstallmentFormRow = {
  installmentNumber: number;
  amountToman: number;
  dueDateUtc?: Date | null;
};

export const COURSE_INSTALLMENT_COUNTS = [2, 3, 4, 5, 6] as const;

export function buildCourseInstallmentPlanRows(
  priceToman: number,
  count: number
): CourseInstallmentFormRow[] {
  const safeCount = Math.min(6, Math.max(2, Math.round(count) || 2));
  const total = Math.max(0, Math.round(Number(priceToman) || 0));
  const per = Math.floor(total / safeCount);
  const remainder = total - per * safeCount;
  const now = new Date();

  return Array.from({ length: safeCount }, (_, i) => {
    const installmentNumber = i + 1;
    let dueDateUtc: Date | null = null;
    if (installmentNumber > 1) {
      dueDateUtc = new Date(now);
      dueDateUtc.setMonth(dueDateUtc.getMonth() + (installmentNumber - 1));
    }
    return {
      installmentNumber,
      amountToman: installmentNumber === safeCount ? per + remainder : per,
      dueDateUtc,
    };
  });
}

export function mapApiInstallmentPlansToFormRows(
  plans: Array<{ installmentNumber: number; amountToman: number; dueDateUtc?: string | Date | null }> | undefined
): CourseInstallmentFormRow[] {
  if (!plans?.length) return [];
  return plans
    .slice()
    .sort((a, b) => a.installmentNumber - b.installmentNumber)
    .map((p) => ({
      installmentNumber: p.installmentNumber,
      amountToman: Number(p.amountToman) || 0,
      dueDateUtc: p.dueDateUtc ? new Date(p.dueDateUtc) : null,
    }));
}

export function serializeInstallmentPlansJson(plans: CourseInstallmentFormRow[]): string {
  return JSON.stringify(
    plans.map((p) => ({
      installmentNumber: p.installmentNumber,
      amountToman: Number(p.amountToman) || 0,
      dueDateUtc: p.installmentNumber === 1 || !p.dueDateUtc ? null : new Date(p.dueDateUtc).toISOString(),
    }))
  );
}

export function installmentPlansSum(plans: { amountToman: number }[]): number {
  return plans.reduce((sum, p) => sum + (Number(p.amountToman) || 0), 0);
}
