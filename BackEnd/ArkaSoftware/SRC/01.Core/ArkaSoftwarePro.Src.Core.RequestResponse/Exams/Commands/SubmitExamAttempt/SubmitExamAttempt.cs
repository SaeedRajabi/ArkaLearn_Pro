using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.SubmitExamAttempt;

public class SubmitExamAttempt : ICommand<string>, IWebRequest
{
    public long AttemptId { get; set; }
    public long UserId { get; set; }
    public List<ExamAnswerDto> Answers { get; set; } = [];
    public string Path => "/api/Service/Exam/SubmitAttempt";
}

public class ExamAnswerDto
{
    public long QuestionId { get; set; }
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }
    /// <summary>Paste events recorded by the client editor for this answer.</summary>
    public int PasteCount { get; set; }
}
