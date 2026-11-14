using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardOverview;

/// <summary>Aggregated widgets for the admin home dashboard.</summary>
public class GetDashboardOverviewQuery : IQuery<GetDashboardOverviewQri>
{
    /// <summary>Number of past months for sales & enrollment series (default 12, max 24).</summary>
    public int Months { get; set; } = 12;
}
