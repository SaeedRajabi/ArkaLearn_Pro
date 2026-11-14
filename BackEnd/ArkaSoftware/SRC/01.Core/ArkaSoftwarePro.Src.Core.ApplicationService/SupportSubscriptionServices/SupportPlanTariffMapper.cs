using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetMyStudentSupportStatus;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices;

internal static class SupportPlanTariffMapper
{
    public static SupportPlanTariffQri Map(SupportPlanTariff tariff)
    {
        tariff.EnsureDefaultFeatureRows();
        return new SupportPlanTariffQri
        {
            Id = tariff.Id,
            DurationMonths = tariff.DurationMonths,
            PriceToman = tariff.PriceToman,
            IsActive = tariff.IsActive,
            Features = SupportPlanFeatureCatalog.All
                .Select(def =>
                {
                    var row = tariff.Features.FirstOrDefault(f =>
                        string.Equals(f.FeatureCode, def.Code, StringComparison.OrdinalIgnoreCase));
                    return new SupportPlanFeatureQri
                    {
                        FeatureCode = def.Code,
                        TitleFa = def.TitleFa,
                        DescriptionFa = def.DescriptionFa,
                        IsOffered = row?.IsOffered ?? true,
                        AddonPriceToman = row?.AddonPriceToman ?? def.DefaultAddonPriceToman,
                        SortOrder = def.SortOrder,
                    };
                })
                .OrderBy(x => x.SortOrder)
                .ToList(),
        };
    }
}
