using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

public class StudentSupportFeatureGrant : Entity
{
    public long StudentSupportSubscriptionId { get; private set; }
    public string FeatureCode { get; private set; } = string.Empty;
    public DateTime GrantedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }

    private StudentSupportFeatureGrant() { }

    public static StudentSupportFeatureGrant Create(
        long subscriptionId,
        string featureCode,
        DateTime grantedAtUtc,
        DateTime expiresAtUtc)
    {
        return new StudentSupportFeatureGrant
        {
            StudentSupportSubscriptionId = subscriptionId,
            FeatureCode = featureCode.Trim(),
            GrantedAtUtc = grantedAtUtc,
            ExpiresAtUtc = expiresAtUtc,
        };
    }

    public void ExtendTo(DateTime expiresAtUtc, DateTime utcNow)
    {
        if (expiresAtUtc > ExpiresAtUtc)
            ExpiresAtUtc = expiresAtUtc;
        GrantedAtUtc = utcNow;
    }

    public bool IsActive(DateTime utcNow) => utcNow < ExpiresAtUtc;
}
