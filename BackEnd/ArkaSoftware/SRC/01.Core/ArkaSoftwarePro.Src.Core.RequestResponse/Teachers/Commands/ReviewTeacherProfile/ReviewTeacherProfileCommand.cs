using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherProfile;

public class ReviewTeacherProfileCommand : ICommand<string>, IWebRequest
{
    public long TeacherId { get; set; }
    public bool Approve { get; set; }
    public string? RejectionNote { get; set; }
    public string Path => "api/Service/Teacher/ReviewProfile";
}
