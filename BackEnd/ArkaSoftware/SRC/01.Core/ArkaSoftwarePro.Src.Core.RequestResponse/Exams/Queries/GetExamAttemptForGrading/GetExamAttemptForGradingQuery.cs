using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamAttemptForGrading;

public class GetExamAttemptForGradingQuery : IQuery<ExamAttemptGradingQri>, IWebRequest
{
    public long AttemptId { get; set; }
    public long TeacherUserId { get; set; }
    public string Path => "/api/Service/Exam/GetAttemptForGrading";
}

public class ExamAttemptGradingQri
{
    public long AttemptId { get; set; }
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public byte Status { get; set; }
    public decimal TotalPoints { get; set; }
    public decimal? AutoScore { get; set; }
    public decimal? FinalScore { get; set; }
    public string? ProfessorFeedback { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    /// <summary>Copy policy of the exam: when false, pasted answers are flagged.</summary>
    public bool AllowPaste { get; set; }
    public List<GradingQuestionQri> Questions { get; set; } = [];
}

public class GradingQuestionQri
{
    public long QuestionId { get; set; }
    public int OrderIndex { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal Points { get; set; }
    public List<GradingQuestionOptionQri> Options { get; set; } = [];
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }
    public decimal? PointsAwarded { get; set; }
    public bool? IsAutoGraded { get; set; }
    /// <summary>Paste events recorded for this answer; shown as a warning badge when > 0.</summary>
    public int PasteCount { get; set; }
}

public class GradingQuestionOptionQri
{
    public long Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
