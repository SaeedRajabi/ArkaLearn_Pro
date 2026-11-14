using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.UpsertSupportPlanTariffs;

public class UpsertSupportPlanTariffFeatureItem
{
    public string FeatureCode { get; set; } = string.Empty;
    public bool IsOffered { get; set; } = true;
    public long AddonPriceToman { get; set; }
}

public class UpsertSupportPlanTariffItem
{
    public int DurationMonths { get; set; }
    public long PriceToman { get; set; }
    public bool IsActive { get; set; } = true;
    public List<UpsertSupportPlanTariffFeatureItem> Features { get; set; } = [];
}

public class UpsertSupportPlanTariffsCommand : ICommand<string>
{
    public List<UpsertSupportPlanTariffItem> Tariffs { get; set; } = [];
}
