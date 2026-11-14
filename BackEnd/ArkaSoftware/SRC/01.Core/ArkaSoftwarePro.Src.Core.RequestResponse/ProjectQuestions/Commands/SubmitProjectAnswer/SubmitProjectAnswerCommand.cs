using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectAnswer;

public class SubmitProjectAnswerCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long QuestionId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }

    public string Path => "/api/Service/ProjectQuestion/SubmitAnswer";
}
