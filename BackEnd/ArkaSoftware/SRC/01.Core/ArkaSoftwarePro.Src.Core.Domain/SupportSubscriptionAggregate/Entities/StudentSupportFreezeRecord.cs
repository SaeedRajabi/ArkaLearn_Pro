using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class StudentSupportFreezeRecord : Entity
{
    public long StudentUserId { get; private set; }
    public long StudentSupportSubscriptionId { get; private set; }
    public DateTime StartedAtUtc { get; private set; }
    public DateTime EndsAtUtc { get; private set; }
    public int DurationDays { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    private StudentSupportFreezeRecord() { }

    public static StudentSupportFreezeRecord Create(
        long studentUserId,
        long subscriptionId,
        DateTime startedAtUtc,
        DateTime endsAtUtc,
        int durationDays,
        string reason)
    {
        return new StudentSupportFreezeRecord
        {
            StudentUserId = studentUserId,
            StudentSupportSubscriptionId = subscriptionId,
            StartedAtUtc = startedAtUtc,
            EndsAtUtc = endsAtUtc,
            DurationDays = durationDays,
            Reason = reason,
        };
    }
}
