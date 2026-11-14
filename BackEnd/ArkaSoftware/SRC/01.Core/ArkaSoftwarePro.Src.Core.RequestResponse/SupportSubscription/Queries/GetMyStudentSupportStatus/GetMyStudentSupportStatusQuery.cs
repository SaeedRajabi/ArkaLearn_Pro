using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetMyStudentSupportStatus;

public class GetMyStudentSupportStatusQuery : IQuery<StudentSupportStatusQri>
{
    public long UserId { get; set; }
}

public class StudentSupportStatusQri
{
    public bool HasActiveAccess { get; set; }
    public bool IsFrozen { get; set; }
    public DateTime? AccessEndsAtUtc { get; set; }
    public int RemainingDays { get; set; }
    public int FreezeCountUsed { get; set; }
    public int FreezeCountRemaining { get; set; }
    public DateTime? FrozenUntilUtc { get; set; }
    public string? ActiveFreezeReason { get; set; }
    public List<StudentSupportFreezeHistoryQri> FreezeHistory { get; set; } = [];
    public List<SupportPlanTariffQri> Plans { get; set; } = [];
    public List<string> ActiveFeatureCodes { get; set; } = [];
}

public class StudentSupportFreezeHistoryQri
{
    public DateTime StartedAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public int DurationDays { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class SupportPlanTariffQri
{
    public long Id { get; set; }
    public int DurationMonths { get; set; }
    public long PriceToman { get; set; }
    public bool IsActive { get; set; }
    public List<SupportPlanFeatureQri> Features { get; set; } = [];
}

public class SupportPlanFeatureQri
{
    public string FeatureCode { get; set; } = string.Empty;
    public string TitleFa { get; set; } = string.Empty;
    public string DescriptionFa { get; set; } = string.Empty;
    public bool IsOffered { get; set; }
    public long AddonPriceToman { get; set; }
    public int SortOrder { get; set; }
}
