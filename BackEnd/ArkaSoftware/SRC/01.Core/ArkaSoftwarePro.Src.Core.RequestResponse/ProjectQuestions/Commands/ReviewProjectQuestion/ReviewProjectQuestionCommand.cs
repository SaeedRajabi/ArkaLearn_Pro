using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.ReviewProjectQuestion;

public class ReviewProjectQuestionCommand : ICommand<string>, IWebRequest
{
    public long QuestionId { get; set; }
    public long ReviewerUserId { get; set; }
    public bool Approve { get; set; }

    public string Path => "/api/Service/ProjectQuestion/Review";
}
