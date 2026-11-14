using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherXpSummary;

public class GetMyTeacherXpSummaryQuery : IQuery<MyTeacherXpSummaryQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetMyTeacherXpSummary";
}

public class MyTeacherXpSummaryQri
{
    public int ExperiencePoints { get; set; }
    public int XpNextFreeMonthThreshold { get; set; }
    public int XpFreeMonthsRedeemed { get; set; }
    public DateTime? XpFreePlanUntilUtc { get; set; }
    public bool CanRedeemFreeMonth { get; set; }
    public TeacherXpRewardsQri Rewards { get; set; } = new();
    public List<TeacherXpEventQri> RecentEvents { get; set; } = [];
}

public class TeacherXpRewardsQri
{
    public int SaveAdvertisement { get; set; }
    public int SaveVideo { get; set; }
    public int SaveBook { get; set; }
    public int PublishCourse { get; set; }
    public int PublishArticle { get; set; }
    public int PortfolioArticle { get; set; }
}

public class TeacherXpEventQri
{
    public long Id { get; set; }
    public int Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int BalanceAfter { get; set; }
    public DateTime OccurredAtUtc { get; set; }
}
