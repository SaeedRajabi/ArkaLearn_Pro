using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class AdvertisementMonetizationRevenue : Entity
{
    public AdvertisementRevenueType RevenueType { get; private set; }
    public long TeacherId { get; private set; }
    public long PayerUserId { get; private set; }
    public long AmountToman { get; private set; }
    public string? PaymentReference { get; private set; }
    public string? Description { get; private set; }
    public DateTime OccurredAtUtc { get; private set; }

    private AdvertisementMonetizationRevenue() { }

    public static AdvertisementMonetizationRevenue Create(
        AdvertisementRevenueType revenueType,
        long teacherId,
        long payerUserId,
        long amountToman,
        string? paymentReference,
        string? description,
        DateTime occurredAtUtc)
    {
        return new AdvertisementMonetizationRevenue
        {
            RevenueType = revenueType,
            TeacherId = teacherId,
            PayerUserId = payerUserId,
            AmountToman = amountToman,
            PaymentReference = paymentReference,
            Description = description,
            OccurredAtUtc = occurredAtUtc,
        };
    }
}
