namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class BankQuestionQueryModel
{
    public long Id { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal DefaultPoints { get; set; }
    public string? Category { get; set; }
    public string? Topic { get; set; }
    public string? Tags { get; set; }
    public long? CourseId { get; set; }
    public long OwnerUserId { get; set; }
    public long? OwnerTeacherId { get; set; }
    public string ContentHash { get; set; } = string.Empty;
    public byte? ManualDifficulty { get; set; }
    public byte ComputedDifficulty { get; set; }
    public int TotalGradedAnswers { get; set; }
    public int CorrectAnswers { get; set; }
    public decimal CorrectRate { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
    public bool IsDelete { get; set; }
    public DateTime? CreatedDateTime { get; set; }
    public List<BankQuestionOptionQueryModel> Options { get; set; } = [];
}

public class BankQuestionOptionQueryModel
{
    public long Id { get; set; }
    public long BankQuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
    public bool IsDelete { get; set; }
    public BankQuestionQueryModel? BankQuestion { get; set; }
}
