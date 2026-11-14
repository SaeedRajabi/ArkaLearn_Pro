using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Commands.LikeProjectAnswer;

public class LikeProjectAnswerCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long AnswerId { get; set; }

    public string Path => "/api/Service/ProjectQuestion/LikeAnswer";
}
