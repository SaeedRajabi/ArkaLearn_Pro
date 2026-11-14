using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.StartExamAttempt;

public class StartExamAttempt : ICommand<StartExamAttemptResult>, IWebRequest
{
    public long ExamId { get; set; }
    public long UserId { get; set; }
    public string Path => "/api/Service/Exam/StartAttempt";
}

public class StartExamAttemptResult
{
    public long AttemptId { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
