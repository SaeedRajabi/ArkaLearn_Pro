using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamById;

public class GetExamByIdQuery : IQuery<ExamDetailQri>, IWebRequest
{
    public long ExamId { get; set; }
    public long TeacherUserId { get; set; }
    public string Path => "/api/Service/Exam/GetById";
}

public class ExamDetailQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public DateTime EndsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public byte Status { get; set; }
    public decimal TotalPoints { get; set; }
    public List<ExamQuestionQri> Questions { get; set; } = [];
    public List<ExamAttemptSummaryQri> Attempts { get; set; } = [];
}

public class ExamQuestionQri
{
    public long Id { get; set; }
    public int OrderIndex { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal Points { get; set; }
    public List<ExamQuestionOptionQri> Options { get; set; } = [];
}

public class ExamQuestionOptionQri
{
    public long Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}

public class ExamAttemptSummaryQri
{
    public long AttemptId { get; set; }
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public byte Status { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public decimal? AutoScore { get; set; }
    public decimal? FinalScore { get; set; }
}
