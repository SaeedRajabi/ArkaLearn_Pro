using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.UpdateStudentProfile;

public class UpdateStudentProfileCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string? HeaderImageUrl { get; set; }
    public string Path => "api/Service/Student/UpdateProfile";
}
