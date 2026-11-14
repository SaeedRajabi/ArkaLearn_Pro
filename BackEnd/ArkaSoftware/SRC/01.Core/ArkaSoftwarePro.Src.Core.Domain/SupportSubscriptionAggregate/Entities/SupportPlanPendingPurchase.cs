using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class SupportPlanPendingPurchase : Entity
{
    public long StudentUserId { get; private set; }
    public long TariffId { get; private set; }
    public string FeatureCodesCsv { get; private set; } = string.Empty;
    public long TotalAmountToman { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public bool IsConsumed { get; private set; }

    private SupportPlanPendingPurchase() { }

    public static SupportPlanPendingPurchase Create(
        long studentUserId,
        long tariffId,
        IEnumerable<string> featureCodes,
        long totalAmountToman,
        DateTime utcNow)
    {
        var codes = featureCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new SupportPlanPendingPurchase
        {
            StudentUserId = studentUserId,
            TariffId = tariffId,
            FeatureCodesCsv = string.Join(',', codes),
            TotalAmountToman = Math.Max(0, totalAmountToman),
            CreatedAtUtc = utcNow,
            ExpiresAtUtc = utcNow.AddHours(6),
            IsConsumed = false,
        };
    }

    public IReadOnlyList<string> GetFeatureCodes() =>
        string.IsNullOrWhiteSpace(FeatureCodesCsv)
            ? []
            : FeatureCodesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public void Refresh(IEnumerable<string> featureCodes, long totalAmountToman, DateTime utcNow)
    {
        var codes = featureCodes
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c, StringComparer.OrdinalIgnoreCase)
            .ToList();

        FeatureCodesCsv = string.Join(',', codes);
        TotalAmountToman = Math.Max(0, totalAmountToman);
        CreatedAtUtc = utcNow;
        ExpiresAtUtc = utcNow.AddHours(6);
        IsConsumed = false;
    }

    public void MarkConsumed() => IsConsumed = true;

    public bool IsOpen(DateTime utcNow) => !IsConsumed && utcNow < ExpiresAtUtc;
}
