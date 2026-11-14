using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsSummary;

public class GetMyTeacherEarningsSummaryQuery : IQuery<MyTeacherEarningsSummaryQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetMyTeacherEarningsSummary";
}

public class MyTeacherEarningsSummaryQri
{
    public long AvailableBalanceToman { get; set; }
    public long ReservedBalanceToman { get; set; }
    public long TotalGrossSalesToman { get; set; }
    public long TotalTaxWithheldToman { get; set; }
    public long TotalPlatformFeeToman { get; set; }
    public long TotalNetEarnedToman { get; set; }
    public long TotalWithdrawnToman { get; set; }
    public int TotalSaleCount { get; set; }
    public decimal IncomeTaxPercent { get; set; }
    public int PayoutCooldownHours { get; set; }
    public bool CanRequestPayout { get; set; }
    public bool HasPayoutBankInfo { get; set; }
    public DateTime? NextPayoutEligibleAtUtc { get; set; }
    public long SalesTodayGrossToman { get; set; }
    public long SalesWeekGrossToman { get; set; }
    public long SalesMonthGrossToman { get; set; }
    public long SalesYearGrossToman { get; set; }
    public long NetTodayToman { get; set; }
    public long NetWeekToman { get; set; }
    public long NetMonthToman { get; set; }
    public long NetYearToman { get; set; }
    public long TaxTodayToman { get; set; }
    public long TaxWeekToman { get; set; }
    public long TaxMonthToman { get; set; }
    public long TaxYearToman { get; set; }
    public int SalesCountToday { get; set; }
    public int SalesCountWeek { get; set; }
    public int SalesCountMonth { get; set; }
    public int SalesCountYear { get; set; }
}
