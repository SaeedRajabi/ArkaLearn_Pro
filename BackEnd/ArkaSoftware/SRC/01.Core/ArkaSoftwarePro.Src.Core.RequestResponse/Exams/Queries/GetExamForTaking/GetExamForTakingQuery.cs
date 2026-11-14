using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamForTaking;

public class GetExamForTakingQuery : IQuery<ExamTakingQri>, IWebRequest
{
    public long ExamId { get; set; }
    public long UserId { get; set; }
    public string Path => "/api/Service/Exam/GetForTaking";
}

public class ExamTakingQri
{
    public long ExamId { get; set; }
    public long AttemptId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public byte AttemptStatus { get; set; }
    public decimal TotalPoints { get; set; }
    public decimal? FinalScore { get; set; }
    public string? ProfessorFeedback { get; set; }
    /// <summary>Copy policy of the exam: true = free copy/paste; false = pasted content is tracked and flagged.</summary>
    public bool AllowPaste { get; set; }
    public List<ExamTakingQuestionQri> Questions { get; set; } = [];
    public List<ExamTakingAnswerQri> Answers { get; set; } = [];
}

public class ExamTakingQuestionQri
{
    public long Id { get; set; }
    public int OrderIndex { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal Points { get; set; }
    public List<ExamTakingOptionQri> Options { get; set; } = [];
}

public class ExamTakingOptionQri
{
    public long Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
}

public class ExamTakingAnswerQri
{
    public long QuestionId { get; set; }
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }
    /// <summary>Paste events the client recorded for this answer.</summary>
    public int PasteCount { get; set; }
    /// <summary>Awarded points once the answer is graded (auto or manual).</summary>
    public decimal? PointsAwarded { get; set; }
}
