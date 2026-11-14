using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

/// <summary>
/// قالب اقساط تعریف‌شده روی دوره (قبل از خرید دانشجو).
/// قسط ۱ معمولاً در لحظه خرید پرداخت می‌شود؛ DueDateUtc برای قسط ۱ می‌تواند MinValue باشد.
/// </summary>
public class CourseInstallmentPlan : Entity
{
    public const int MinInstallmentCount = 2;
    public const int MaxInstallmentCount = 6;

    public long CourseId { get; private set; }
    public Course? Course { get; private set; }
    public int InstallmentNumber { get; private set; }
    public decimal AmountToman { get; private set; }
    /// <summary>برای قسط ۱ معمولاً تاریخ خرید است؛ برای بقیه سررسید تعریف‌شده توسط استاد.</summary>
    public DateTime? DueDateUtc { get; private set; }

    private CourseInstallmentPlan() { }

    public static CourseInstallmentPlan Create(int installmentNumber, decimal amountToman, DateTime? dueDateUtc)
    {
        if (installmentNumber < 1 || installmentNumber > MaxInstallmentCount)
            throw new ArgumentOutOfRangeException(nameof(installmentNumber), "Installment number must be between 1 and 6.");
        if (amountToman <= 0)
            throw new ArgumentException("Installment amount must be positive.", nameof(amountToman));

        return new CourseInstallmentPlan
        {
            InstallmentNumber = installmentNumber,
            AmountToman = amountToman,
            DueDateUtc = dueDateUtc,
        };
    }

    public void Update(decimal amountToman, DateTime? dueDateUtc)
    {
        if (amountToman <= 0)
            throw new ArgumentException("Installment amount must be positive.", nameof(amountToman));
        AmountToman = amountToman;
        DueDateUtc = dueDateUtc;
    }
}
