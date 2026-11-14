using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class StudentSupportSubscription : AggregateRoot
{
    public const int MaxFreezeCount = 2;
    public const int MinFreezeDays = 7;
    public const int MaxFreezeDays = 30;

    public long StudentUserId { get; private set; }
    public DateTime? AccessEndsAtUtc { get; private set; }
    public int FreezeCountUsed { get; private set; }
    public DateTime? FrozenUntilUtc { get; private set; }
    public string? ActiveFreezeReason { get; private set; }
    public int? RemainingSecondsWhileFrozen { get; private set; }
    public DateTime? FrozenStartedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public IReadOnlyList<StudentSupportFreezeRecord> FreezeHistory => _freezeHistory;
    private readonly List<StudentSupportFreezeRecord> _freezeHistory = [];

    public IReadOnlyList<StudentSupportFeatureGrant> FeatureGrants => _featureGrants;
    private readonly List<StudentSupportFeatureGrant> _featureGrants = [];

    private StudentSupportSubscription() { }

    public static StudentSupportSubscription CreateForStudent(long studentUserId)
    {
        return new StudentSupportSubscription
        {
            StudentUserId = studentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
        };
    }

    public void ResolveExpiredFreeze(DateTime utcNow)
    {
        if (!FrozenUntilUtc.HasValue || utcNow < FrozenUntilUtc.Value)
            return;

        if (RemainingSecondsWhileFrozen is > 0)
            AccessEndsAtUtc = utcNow.AddSeconds(RemainingSecondsWhileFrozen.Value);

        FrozenUntilUtc = null;
        RemainingSecondsWhileFrozen = null;
        ActiveFreezeReason = null;
        FrozenStartedAtUtc = null;
        UpdatedAtUtc = utcNow;
    }

    public bool IsFrozen(DateTime utcNow)
    {
        ResolveExpiredFreeze(utcNow);
        return FrozenUntilUtc.HasValue && utcNow < FrozenUntilUtc.Value;
    }

    public bool HasActiveAccess(DateTime utcNow)
    {
        ResolveExpiredFreeze(utcNow);
        if (!AccessEndsAtUtc.HasValue)
            return false;
        if (IsFrozen(utcNow))
            return false;
        return utcNow < AccessEndsAtUtc.Value;
    }

    public int RemainingDays(DateTime utcNow)
    {
        ResolveExpiredFreeze(utcNow);
        if (!AccessEndsAtUtc.HasValue || IsFrozen(utcNow))
            return 0;
        var remaining = AccessEndsAtUtc.Value - utcNow;
        return remaining.TotalDays <= 0 ? 0 : (int)Math.Ceiling(remaining.TotalDays);
    }

    public const int MaxTeacherGrantMonths = 5;

    public void GrantMonths(int months, DateTime utcNow, long? grantedByUserId, string source)
    {
        if (months <= 0)
            throw new InvalidEntityStateException("Months must be positive.", nameof(months));

        ResolveExpiredFreeze(utcNow);

        if (FrozenUntilUtc.HasValue && utcNow < FrozenUntilUtc.Value)
        {
            if (RemainingSecondsWhileFrozen is > 0)
                AccessEndsAtUtc = utcNow.AddSeconds(RemainingSecondsWhileFrozen.Value);

            FrozenUntilUtc = null;
            RemainingSecondsWhileFrozen = null;
            ActiveFreezeReason = null;
            FrozenStartedAtUtc = null;
        }

        var baseDate = AccessEndsAtUtc.HasValue && AccessEndsAtUtc.Value > utcNow
            ? AccessEndsAtUtc.Value
            : utcNow;
        AccessEndsAtUtc = baseDate.AddMonths(months);
        UpdatedAtUtc = utcNow;
        _ = grantedByUserId;
        _ = source;
    }

    public void GrantFeatures(IEnumerable<string> featureCodes, DateTime utcNow)
    {
        ResolveExpiredFreeze(utcNow);
        if (!AccessEndsAtUtc.HasValue || AccessEndsAtUtc.Value <= utcNow)
            return;

        var expires = AccessEndsAtUtc.Value;
        foreach (var code in featureCodes
                     .Where(c => !string.IsNullOrWhiteSpace(c))
                     .Select(c => c.Trim())
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!SupportPlanFeatureCatalog.IsKnown(code))
                continue;

            var existing = _featureGrants.FirstOrDefault(x =>
                string.Equals(x.FeatureCode, code, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
                _featureGrants.Add(StudentSupportFeatureGrant.Create(Id, code, utcNow, expires));
            else
                existing.ExtendTo(expires, utcNow);
        }

        UpdatedAtUtc = utcNow;
    }

    public IReadOnlyList<string> GetActiveFeatureCodes(DateTime utcNow)
    {
        ResolveExpiredFreeze(utcNow);
        return _featureGrants
            .Where(x => x.IsActive(utcNow))
            .Select(x => x.FeatureCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();
    }

    public bool HasFeature(string featureCode, DateTime utcNow)
    {
        if (!HasActiveAccess(utcNow))
            return false;
        return _featureGrants.Any(x =>
            string.Equals(x.FeatureCode, featureCode, StringComparison.OrdinalIgnoreCase)
            && x.IsActive(utcNow));
    }

    public void StartFreeze(int freezeDays, string reason, DateTime utcNow)
    {
        if (freezeDays < MinFreezeDays || freezeDays > MaxFreezeDays)
            throw new InvalidEntityStateException($"Freeze duration must be between {MinFreezeDays} and {MaxFreezeDays} days.", nameof(freezeDays));

        if (FreezeCountUsed >= MaxFreezeCount)
            throw new InvalidEntityStateException("Maximum freeze count reached.", nameof(FreezeCountUsed));

        ResolveExpiredFreeze(utcNow);

        if (FrozenUntilUtc.HasValue && utcNow < FrozenUntilUtc.Value)
            throw new InvalidEntityStateException("Support is already frozen.", nameof(FrozenUntilUtc));

        if (!AccessEndsAtUtc.HasValue || AccessEndsAtUtc.Value <= utcNow)
            throw new InvalidEntityStateException("No active support time to freeze.", nameof(AccessEndsAtUtc));

        var reasonText = (reason ?? string.Empty).Trim();
        if (reasonText.Length < 5)
            throw new InvalidEntityStateException("Freeze reason is required.", nameof(reason));

        var remainingSeconds = (int)Math.Max(0, (AccessEndsAtUtc.Value - utcNow).TotalSeconds);
        FrozenStartedAtUtc = utcNow;
        FrozenUntilUtc = utcNow.AddDays(freezeDays);
        RemainingSecondsWhileFrozen = remainingSeconds;
        ActiveFreezeReason = reasonText.Length > 500 ? reasonText[..500] : reasonText;
        AccessEndsAtUtc = null;
        FreezeCountUsed++;
        UpdatedAtUtc = utcNow;

        _freezeHistory.Add(StudentSupportFreezeRecord.Create(
            StudentUserId,
            Id,
            FrozenStartedAtUtc.Value,
            FrozenUntilUtc.Value,
            freezeDays,
            ActiveFreezeReason));
    }
}
