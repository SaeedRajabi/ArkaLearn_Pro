using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class SupportPlanTariff : Entity
{
    public int DurationMonths { get; private set; }
    public long PriceToman { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int SortOrder { get; private set; }

    public IReadOnlyList<SupportPlanTariffFeature> Features => _features;
    private readonly List<SupportPlanTariffFeature> _features = [];

    private SupportPlanTariff() { }

    public static SupportPlanTariff Create(int durationMonths, long priceToman, int sortOrder)
    {
        var tariff = new SupportPlanTariff
        {
            DurationMonths = durationMonths,
            PriceToman = priceToman,
            SortOrder = sortOrder,
            IsActive = true,
        };
        tariff.EnsureDefaultFeatureRows();
        return tariff;
    }

    public void Update(long priceToman, bool isActive, int sortOrder)
    {
        PriceToman = priceToman;
        IsActive = isActive;
        SortOrder = sortOrder;
    }

    public void EnsureDefaultFeatureRows()
    {
        foreach (var def in SupportPlanFeatureCatalog.All)
        {
            if (_features.Any(f => string.Equals(f.FeatureCode, def.Code, StringComparison.OrdinalIgnoreCase)))
                continue;

            _features.Add(SupportPlanTariffFeature.Create(
                Id,
                def.Code,
                isOffered: true,
                def.DefaultAddonPriceToman,
                def.SortOrder));
        }
    }

    public void SyncFeatures(IEnumerable<(string Code, bool IsOffered, long AddonPriceToman)> features)
    {
        EnsureDefaultFeatureRows();
        var map = features
            .Where(f => SupportPlanFeatureCatalog.IsKnown(f.Code))
            .GroupBy(f => f.Code, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Last(), StringComparer.OrdinalIgnoreCase);

        foreach (var row in _features)
        {
            if (!map.TryGetValue(row.FeatureCode, out var incoming))
                continue;
            var def = SupportPlanFeatureCatalog.Find(row.FeatureCode)!;
            row.Update(incoming.IsOffered, incoming.AddonPriceToman, def.SortOrder);
        }
    }

    public long CalculateTotalPrice(IEnumerable<string> selectedFeatureCodes)
    {
        var selected = selectedFeatureCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        long total = PriceToman;
        foreach (var feature in _features.Where(f => f.IsOffered))
        {
            if (!selected.Contains(feature.FeatureCode))
                continue;
            total += feature.AddonPriceToman;
        }

        return total;
    }

    public IReadOnlyList<string> NormalizeSelectedFeatures(IEnumerable<string> selectedFeatureCodes)
    {
        var selected = selectedFeatureCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return _features
            .Where(f => f.IsOffered && selected.Contains(f.FeatureCode))
            .OrderBy(f => f.SortOrder)
            .Select(f => f.FeatureCode)
            .ToList();
    }
}
