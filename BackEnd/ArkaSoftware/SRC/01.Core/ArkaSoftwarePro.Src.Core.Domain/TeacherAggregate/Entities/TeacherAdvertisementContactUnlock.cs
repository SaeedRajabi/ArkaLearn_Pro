using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherAdvertisementContactUnlock : Entity
{
    public long ViewerUserId { get; private set; }
    public long TeacherId { get; private set; }
    public DateTime UnlockedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public string? PaymentReference { get; private set; }

    private TeacherAdvertisementContactUnlock() { }

    public static TeacherAdvertisementContactUnlock Create(
        long viewerUserId,
        long teacherId,
        DateTime unlockedAtUtc,
        int unlockHours,
        string? paymentReference)
    {
        return new TeacherAdvertisementContactUnlock
        {
            ViewerUserId = viewerUserId,
            TeacherId = teacherId,
            UnlockedAtUtc = unlockedAtUtc,
            ExpiresAtUtc = unlockedAtUtc.AddHours(unlockHours),
            PaymentReference = paymentReference,
        };
    }

    public bool IsValidAt(DateTime utcNow) => ExpiresAtUtc > utcNow;
}
