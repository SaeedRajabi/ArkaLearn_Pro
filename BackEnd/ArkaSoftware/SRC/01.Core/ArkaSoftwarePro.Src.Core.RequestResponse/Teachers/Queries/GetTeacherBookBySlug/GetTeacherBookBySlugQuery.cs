using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBookBySlug;

public class GetTeacherBookBySlugQuery : IQuery<TeacherBookPublicQri>, IWebRequest
{
    public string Slug { get; set; } = string.Empty;
    public string Path => "/api/Service/Teacher/GetBookBySlug";
}
