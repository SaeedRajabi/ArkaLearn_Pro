using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherPayouts;

public class GetMyTeacherPayoutsQuery : IQuery<List<TeacherPayoutQri>>, IWebRequest
{
    public int Take { get; set; } = 20;
    public string Path => "/api/Service/Teacher/GetMyTeacherPayouts";
}

public class TeacherPayoutQri
{
    public long Id { get; set; }
    public long AmountToman { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }
    public string? TeacherNote { get; set; }
    public string? AdminNote { get; set; }
    public string? TransferReference { get; set; }
}
