using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherAdvertisementSubscription : Entity
{
    public long TeacherId { get; private set; }
    public long TariffId { get; private set; }
    public int StarLevel { get; private set; }
    public int DurationMonths { get; private set; }
    public DateTime StartedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public string? PaymentReference { get; private set; }
    public AdvertisementSubscriptionStatus Status { get; private set; } = AdvertisementSubscriptionStatus.Active;

    private TeacherAdvertisementSubscription() { }

    public static TeacherAdvertisementSubscription Create(
        long teacherId,
        long tariffId,
        int starLevel,
        int durationMonths,
        DateTime startedAtUtc,
        string? paymentReference)
    {
        return new TeacherAdvertisementSubscription
        {
            TeacherId = teacherId,
            TariffId = tariffId,
            StarLevel = starLevel,
            DurationMonths = durationMonths,
            StartedAtUtc = startedAtUtc,
            ExpiresAtUtc = startedAtUtc.AddMonths(durationMonths),
            PaymentReference = paymentReference,
            Status = AdvertisementSubscriptionStatus.Active,
        };
    }

    public bool IsActiveAt(DateTime utcNow) =>
        Status == AdvertisementSubscriptionStatus.Active && ExpiresAtUtc > utcNow;

    public void MarkExpired() => Status = AdvertisementSubscriptionStatus.Expired;
}
