using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherAdvertisementAutoBumpPurchase : Entity
{
    public long TeacherId { get; private set; }
    public long PackageId { get; private set; }
    public long PaidAmountToman { get; private set; }
    public DateTime StartedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? LastAutoBumpAtUtc { get; private set; }
    public string? PaymentReference { get; private set; }
    public AdvertisementBumpPurchaseType PurchaseType { get; private set; } = AdvertisementBumpPurchaseType.AutoBumpPackage;

    private TeacherAdvertisementAutoBumpPurchase() { }

    public static TeacherAdvertisementAutoBumpPurchase Create(
        long teacherId,
        long packageId,
        long paidAmountToman,
        int durationDays,
        DateTime startedAtUtc,
        string? paymentReference)
    {
        return new TeacherAdvertisementAutoBumpPurchase
        {
            TeacherId = teacherId,
            PackageId = packageId,
            PaidAmountToman = paidAmountToman,
            StartedAtUtc = startedAtUtc,
            ExpiresAtUtc = startedAtUtc.AddDays(durationDays > 0 ? durationDays : 7),
            PaymentReference = paymentReference,
            PurchaseType = AdvertisementBumpPurchaseType.AutoBumpPackage,
        };
    }

    public bool IsActiveAt(DateTime utcNow) => ExpiresAtUtc > utcNow;

    public void MarkAutoBumpExecuted(DateTime utcNow) => LastAutoBumpAtUtc = utcNow;
}
