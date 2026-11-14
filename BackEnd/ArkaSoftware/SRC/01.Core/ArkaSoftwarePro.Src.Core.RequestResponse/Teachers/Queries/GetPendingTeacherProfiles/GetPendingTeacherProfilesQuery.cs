using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherProfiles;

public class GetPendingTeacherProfilesQuery : IQuery<List<PendingTeacherProfileQri>>, IWebRequest
{
    public string Path => "api/Service/Teacher/GetPendingProfiles";
}

public class PendingTeacherProfileQri
{
    public long TeacherId { get; set; }
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string TeachingCategoryName { get; set; } = string.Empty;
    public DateTime? SubmittedAtUtc { get; set; }
    public string ProfileApprovalStatus { get; set; } = string.Empty;
}
