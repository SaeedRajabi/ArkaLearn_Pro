using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherContent;

public class ReviewTeacherContentCommand : ICommand<string>, IWebRequest
{
    public string ContentType { get; set; } = string.Empty;
    public long ContentId { get; set; }
    public bool Approve { get; set; }
    public string? RejectionNote { get; set; }
    public string Path => "api/Service/Teacher/ReviewContent";
}
