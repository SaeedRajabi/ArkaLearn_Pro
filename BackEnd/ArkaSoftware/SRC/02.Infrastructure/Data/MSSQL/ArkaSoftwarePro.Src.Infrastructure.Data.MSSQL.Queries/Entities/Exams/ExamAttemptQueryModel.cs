namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamAttemptQueryModel
{
    public long Id { get; set; }
    public long ExamId { get; set; }
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public byte Status { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public decimal? AutoScore { get; set; }
    public decimal? FinalScore { get; set; }
    public string? ProfessorFeedback { get; set; }
    public DateTime? GradedAtUtc { get; set; }
    public ExamQueryModel? Exam { get; set; }
    public List<ExamAnswerQueryModel> Answers { get; set; } = [];
}
