namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamAnswerQueryModel
{
    public long Id { get; set; }
    public long ExamAttemptId { get; set; }
    public long ExamQuestionId { get; set; }
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }
    public decimal? PointsAwarded { get; set; }
    public bool? IsAutoGraded { get; set; }
    public int PasteCount { get; set; }
    public ExamAttemptQueryModel? ExamAttempt { get; set; }
}
