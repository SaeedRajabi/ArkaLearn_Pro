using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;

public class EducationPlanInstallment : Entity
{
    public const decimal InstallmentMarkupPercent = 25m;

    public long EducationPlanId { get; private set; }
    public EducationPlan? EducationPlan { get; private set; }
    public int InstallmentNumber { get; private set; }
    public DateTime DueDateUtc { get; private set; }
    public decimal AmountToman { get; private set; }
    public bool IsPaid { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }
    public string? PaymentReference { get; private set; }
    /// <summary>Legacy single-shot reminder timestamp (due-day). Prefer ReminderSentOffsetsJson.</summary>
    public DateTime? ReminderSentAtUtc { get; private set; }
    /// <summary>JSON array of offsetDays already notified, e.g. [-1,0].</summary>
    public string ReminderSentOffsetsJson { get; private set; } = "[]";

    private EducationPlanInstallment() { }

    public static EducationPlanInstallment Create(
        int installmentNumber,
        DateTime dueDateUtc,
        decimal amountToman)
    {
        if (installmentNumber <= 0)
            throw new ArgumentException("Installment number must be positive.", nameof(installmentNumber));
        if (amountToman <= 0)
            throw new ArgumentException("Installment amount must be positive.", nameof(amountToman));

        return new EducationPlanInstallment
        {
            InstallmentNumber = installmentNumber,
            DueDateUtc = dueDateUtc,
            AmountToman = amountToman,
            IsPaid = false,
        };
    }

    public void MarkPaid(string? paymentReference, DateTime paidAtUtc)
    {
        IsPaid = true;
        PaidAtUtc = paidAtUtc;
        PaymentReference = paymentReference?.Trim();
    }

    public void MarkReminderSent(DateTime sentAtUtc) => ReminderSentAtUtc = sentAtUtc;

    public bool HasReminderOffsetSent(int offsetDays)
    {
        if (EducationPlanInstallmentReminderOffsets.Contains(ReminderSentOffsetsJson, offsetDays))
            return true;

        // Legacy: ReminderSentAtUtc means due-day (offset 0) was already sent.
        return offsetDays == 0 && ReminderSentAtUtc.HasValue;
    }

    public void MarkReminderOffsetSent(int offsetDays, DateTime sentAtUtc)
    {
        ReminderSentOffsetsJson = EducationPlanInstallmentReminderOffsets.Add(ReminderSentOffsetsJson, offsetDays);
        if (offsetDays == 0)
            ReminderSentAtUtc = sentAtUtc;
    }

    public void UpdateSchedule(DateTime dueDateUtc, decimal amountToman)
    {
        if (IsPaid)
            throw new InvalidOperationException("Paid installments cannot be modified.");

        if (amountToman <= 0)
            throw new ArgumentException("Installment amount must be positive.", nameof(amountToman));

        DueDateUtc = dueDateUtc;
        AmountToman = amountToman;
    }

    public bool IsOverdue(DateTime utcNow) => !IsPaid && utcNow > DueDateUtc;
}
