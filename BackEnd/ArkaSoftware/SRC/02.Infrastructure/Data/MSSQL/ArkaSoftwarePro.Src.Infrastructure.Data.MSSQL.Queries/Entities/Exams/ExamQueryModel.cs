namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamQueryModel
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long CourseId { get; set; }
    public long TeacherId { get; set; }
    public string Level { get; set; } = string.Empty;
    public DateTime EndsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public byte Status { get; set; }
    public decimal TotalPoints { get; set; }
    public bool AllowPaste { get; set; }
    public DateTime? CreatedDateTime { get; set; }
    public List<ExamQuestionQueryModel> Questions { get; set; } = [];
    public List<ExamAssignmentQueryModel> Assignments { get; set; } = [];
    public List<ExamAttemptQueryModel> Attempts { get; set; } = [];
}
