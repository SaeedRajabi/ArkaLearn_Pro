using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;

public class GetStudentProfileQuery : IQuery<StudentProfileQri>, IWebRequest
{
    public long? UserId { get; set; }
    public string? UserName { get; set; }
    public string Path => "api/Service/Student/GetProfile";
}
