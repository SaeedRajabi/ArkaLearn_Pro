namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamQuestionOptionQueryModel
{
    public long Id { get; set; }
    public long ExamQuestionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
    public ExamQuestionQueryModel? ExamQuestion { get; set; }
}
