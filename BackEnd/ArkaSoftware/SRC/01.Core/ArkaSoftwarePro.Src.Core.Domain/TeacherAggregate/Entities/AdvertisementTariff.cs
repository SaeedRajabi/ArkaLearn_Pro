using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class AdvertisementTariff : Entity
{
    public int DurationMonths { get; private set; }
    public int StarLevel { get; private set; }
    public long PriceToman { get; private set; }
    public int DiscountPercent { get; private set; }
    public bool IsActive { get; private set; } = true;

    private AdvertisementTariff() { }

    public static AdvertisementTariff Create(int durationMonths, int starLevel, long priceToman, int discountPercent)
    {
        return new AdvertisementTariff
        {
            DurationMonths = durationMonths,
            StarLevel = starLevel,
            PriceToman = priceToman,
            DiscountPercent = discountPercent,
            IsActive = true,
        };
    }

    public void UpdatePrice(long priceToman, int discountPercent, bool isActive)
    {
        PriceToman = priceToman;
        DiscountPercent = discountPercent;
        IsActive = isActive;
    }
}
