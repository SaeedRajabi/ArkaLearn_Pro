using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;

public class SearchPortalStudentsQuery : PageQuery<PagedData<PortalStudentQri>>, IWebRequest
{
    public string? InputValue { get; set; }

    /// <summary>0 = all students; otherwise exact portal user id</summary>
    public long UserId { get; set; }

    /// <summary>null = all, true = active only, false = inactive/blocked</summary>
    public bool? IsActive { get; set; }

    public string Path => "/api/Service/Student/SearchPortalStudents";
}
