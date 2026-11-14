using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;

[CacheableQuery(CacheRegion.Teachers)]
public class GetTeacherProfileQuery : IQuery<TeacherProfileQri>, IWebRequest
{
    public long? TeacherId { get; set; }
    public string? UserName { get; set; }
    /// <summary>When true, returns draft/unapproved content (caller must be profile owner via auth).</summary>
    public bool ForEdit { get; set; }
    public long? ViewerUserId { get; set; }
    public string Path => "api/Service/Teacher/GetProfile";
}
