using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsChart;

public class GetMyTeacherEarningsChartQuery : IQuery<List<TeacherEarningsChartPointQri>>, IWebRequest
{
    public string Period { get; set; } = "month";
    public string Path => "/api/Service/Teacher/GetMyTeacherEarningsChart";
}

public class TeacherEarningsChartPointQri
{
    public string Label { get; set; } = string.Empty;
    public long GrossToman { get; set; }
    public long NetToman { get; set; }
    public long TaxToman { get; set; }
    public int SaleCount { get; set; }
}
