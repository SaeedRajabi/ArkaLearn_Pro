using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.AbandonExamAttempt;

public class AbandonExamAttempt : ICommand<string>, IWebRequest
{
    public long AttemptId { get; set; }
    public long UserId { get; set; }
    public string Path => "/api/Service/Exam/AbandonAttempt";
}
