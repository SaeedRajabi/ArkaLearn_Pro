using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

public class TeacherPayoutRequest : Entity
{
    public long TeacherId { get; private set; }
    public long AmountToman { get; private set; }
    public TeacherPayoutStatus Status { get; private set; }
    public DateTime RequestedAtUtc { get; private set; }
    public DateTime? ProcessedAtUtc { get; private set; }
    public string? TeacherNote { get; private set; }
    public string? AdminNote { get; private set; }
    public string? TransferReference { get; private set; }

    private TeacherPayoutRequest() { }

    public static TeacherPayoutRequest Create(long teacherId, long amountToman, string? teacherNote)
    {
        return new TeacherPayoutRequest
        {
            TeacherId = teacherId,
            AmountToman = amountToman,
            Status = TeacherPayoutStatus.Pending,
            RequestedAtUtc = DateTime.UtcNow,
            TeacherNote = teacherNote?.Trim(),
        };
    }

    public void MarkPaid(string? transferReference, string? adminNote)
    {
        Status = TeacherPayoutStatus.Paid;
        ProcessedAtUtc = DateTime.UtcNow;
        TransferReference = transferReference?.Trim();
        AdminNote = adminNote?.Trim();
    }

    public void MarkRejected(string? adminNote)
    {
        Status = TeacherPayoutStatus.Rejected;
        ProcessedAtUtc = DateTime.UtcNow;
        AdminNote = adminNote?.Trim();
    }
}
