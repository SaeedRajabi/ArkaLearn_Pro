namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamQuestionQueryModel
{
    public long Id { get; set; }
    public long ExamId { get; set; }
    public long? BankQuestionId { get; set; }
    public int OrderIndex { get; set; }
    public byte QuestionType { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? CodeLanguage { get; set; }
    public decimal Points { get; set; }
    public ExamQueryModel? Exam { get; set; }
    public List<ExamQuestionOptionQueryModel> Options { get; set; } = [];
}
