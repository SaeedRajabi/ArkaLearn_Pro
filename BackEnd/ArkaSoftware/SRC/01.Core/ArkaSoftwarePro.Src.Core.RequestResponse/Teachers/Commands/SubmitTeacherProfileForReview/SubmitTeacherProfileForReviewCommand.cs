using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SubmitTeacherProfileForReview;

public class SubmitTeacherProfileForReviewCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string Path => "api/Service/Teacher/SubmitForReview";
}
