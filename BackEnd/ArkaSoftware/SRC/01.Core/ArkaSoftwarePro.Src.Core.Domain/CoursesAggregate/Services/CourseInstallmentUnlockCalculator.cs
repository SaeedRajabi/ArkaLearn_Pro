namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;

/// <summary>
/// محاسبه درس‌های قابل‌دسترسی بر اساس تعداد اقساط پرداخت‌شده.
/// </summary>
public static class CourseInstallmentUnlockCalculator
{
    /// <summary>
    /// از لیست مرتب‌شده درس‌ها، به تعداد ceil(paidCount / totalInstallments * N) درس اول را برمی‌گرداند.
    /// اگر همه اقساط پرداخت شده باشد، همه درس‌ها را برمی‌گرداند.
    /// </summary>
    public static IReadOnlyList<long> GetUnlockedLessonIds(
        IReadOnlyList<long> orderedLessonIds,
        int paidInstallmentCount,
        int totalInstallments)
    {
        if (orderedLessonIds.Count == 0 || paidInstallmentCount <= 0 || totalInstallments <= 0)
            return Array.Empty<long>();

        if (paidInstallmentCount >= totalInstallments)
            return orderedLessonIds.ToList();

        var unlockCount = (int)Math.Ceiling(paidInstallmentCount * (double)orderedLessonIds.Count / totalInstallments);
        unlockCount = Math.Clamp(unlockCount, 1, orderedLessonIds.Count);
        return orderedLessonIds.Take(unlockCount).ToList();
    }
}
