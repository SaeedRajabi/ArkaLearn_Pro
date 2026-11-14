using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;

public class Installment : Entity
{
    public int InstallmentNumber { get; private set; }
    public DateTime DueDate { get; private set; }
    public decimal Amount { get; private set; }
    public bool IsPaid { get; private set; }
    public DateTime? PaidDate { get; private set; }
    public string? PaymentReference { get; private set; }
    public DateTime? ReminderTwoDaysSentAtUtc { get; private set; }
    public DateTime? ReminderOneDaySentAtUtc { get; private set; }
    public DateTime? ReminderDueDaySentAtUtc { get; private set; }

    public long EnrollmentId { get; private set; }
    public Enrollment? Enrollment { get; private set; }

    public Installment()
    {
    }

    private Installment(
        int installmentNumber,
        DateTime dueDate,
        decimal amount,
        bool isPaid,
        DateTime? paidDate,
        long enrollmentId)
    {
        InstallmentNumber = installmentNumber;
        DueDate = dueDate;
        Amount = amount;
        IsPaid = isPaid;
        PaidDate = paidDate;
        EnrollmentId = enrollmentId;
    }

    public static Installment Create(
        int installmentNumber,
        DateTime dueDate,
        decimal amount,
        bool isPaid,
        DateTime? paidDate,
        long enrollmentId)
        => new(installmentNumber, dueDate, amount, isPaid, paidDate, enrollmentId);

    /// <summary>سازگاری با فراخوانی‌های قدیمی بدون شماره قسط.</summary>
    public static Installment Create(DateTime dueDate, decimal amount, bool isPaid, DateTime? paidDate, long enrollmentId)
        => Create(1, dueDate, amount, isPaid, paidDate, enrollmentId);

    public void MarkPaid(string? paymentReference, DateTime paidAtUtc)
    {
        IsPaid = true;
        PaidDate = paidAtUtc;
        PaymentReference = paymentReference?.Trim();
    }

    public void MarkReminderTwoDaysSent(DateTime sentAtUtc) => ReminderTwoDaysSentAtUtc = sentAtUtc;
    public void MarkReminderOneDaySent(DateTime sentAtUtc) => ReminderOneDaySentAtUtc = sentAtUtc;
    public void MarkReminderDueDaySent(DateTime sentAtUtc) => ReminderDueDaySentAtUtc = sentAtUtc;

    public bool IsOverdue(DateTime utcNow) => !IsPaid && utcNow.Date > DueDate.Date;
}
