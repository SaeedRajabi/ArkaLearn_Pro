using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class SupportPlanTariffFeature : Entity
{
    public long SupportPlanTariffId { get; private set; }
    public string FeatureCode { get; private set; } = string.Empty;
    public bool IsOffered { get; private set; }
    public long AddonPriceToman { get; private set; }
    public int SortOrder { get; private set; }

    private SupportPlanTariffFeature() { }

    public static SupportPlanTariffFeature Create(
        long tariffId,
        string featureCode,
        bool isOffered,
        long addonPriceToman,
        int sortOrder)
    {
        return new SupportPlanTariffFeature
        {
            SupportPlanTariffId = tariffId,
            FeatureCode = featureCode.Trim(),
            IsOffered = isOffered,
            AddonPriceToman = Math.Max(0, addonPriceToman),
            SortOrder = sortOrder,
        };
    }

    public void Update(bool isOffered, long addonPriceToman, int sortOrder)
    {
        IsOffered = isOffered;
        AddonPriceToman = Math.Max(0, addonPriceToman);
        SortOrder = sortOrder;
    }
}
