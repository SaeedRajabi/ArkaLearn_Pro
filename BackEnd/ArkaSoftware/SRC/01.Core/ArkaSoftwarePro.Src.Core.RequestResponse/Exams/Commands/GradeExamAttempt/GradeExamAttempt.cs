using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.GradeExamAttempt;

public class GradeExamAttempt : ICommand<string>, IWebRequest
{
    public long AttemptId { get; set; }
    public long TeacherUserId { get; set; }
    public decimal FinalScore { get; set; }
    public string? ProfessorFeedback { get; set; }
    public List<GradeQuestionDto> QuestionGrades { get; set; } = [];
    public string Path => "/api/Service/Exam/GradeAttempt";
}

public class GradeQuestionDto
{
    public long QuestionId { get; set; }
    public decimal PointsAwarded { get; set; }
}
