using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Commands.CreateExam;

public class CreateExam : ICommand<string>, IWebRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long CourseId { get; set; }
    public string Level { get; set; } = "beginner";
    public DateTime EndsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public long TeacherUserId { get; set; }
    /// <summary>Teacher-controlled copy policy: true lets students paste freely; false (default) flags pasted content for the teacher.</summary>
    public bool AllowPaste { get; set; }
    public List<CreateExamQuestionDto> Questions { get; set; } = [];
    public List<long> StudentIds { get; set; } = [];
    public string Path => "/api/Service/Exam/Create";
}

public class CreateExamQuestionDto
{
    public int OrderIndex { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal Points { get; set; }
    /// <summary>When set, snapshot content from the bank question (and link).</summary>
    public long? BankQuestionId { get; set; }
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public List<CreateExamOptionDto> Options { get; set; } = [];
}

public class CreateExamOptionDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}
