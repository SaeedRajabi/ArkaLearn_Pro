using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.SubmitProjectQuestion;

public class SubmitProjectQuestionCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ProjectId { get; set; }
    public string? Subject { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }

    public string Path => "/api/Service/ProjectQuestion/Submit";
}
