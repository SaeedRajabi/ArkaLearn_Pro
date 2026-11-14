using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationRevenue;

public class GetAdvertisementMonetizationRevenueQuery : IQuery<AdvertisementMonetizationRevenueReportQri>, IWebRequest
{
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public string Path => "/api/Service/Teacher/GetAdvertisementMonetizationRevenue";
}

public class AdvertisementMonetizationRevenueReportQri
{
    public long TotalToman { get; set; }
    public long SubscriptionToman { get; set; }
    public long ContactUnlockToman { get; set; }
    public long OneTimeBumpToman { get; set; }
    public long AutoBumpPackageToman { get; set; }
    public List<AdvertisementRevenueItemQri> Items { get; set; } = [];
}

public class AdvertisementRevenueItemQri
{
    public long Id { get; set; }
    public string RevenueType { get; set; } = string.Empty;
    public long TeacherId { get; set; }
    public long PayerUserId { get; set; }
    public long AmountToman { get; set; }
    public string? PaymentReference { get; set; }
    public string? Description { get; set; }
    public DateTime OccurredAtUtc { get; set; }
}
