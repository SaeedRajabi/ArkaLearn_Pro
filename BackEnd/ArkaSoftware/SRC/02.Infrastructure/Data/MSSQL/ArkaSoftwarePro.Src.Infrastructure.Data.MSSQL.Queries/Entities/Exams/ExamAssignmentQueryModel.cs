namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;

public class ExamAssignmentQueryModel
{
    public long Id { get; set; }
    public long ExamId { get; set; }
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public DateTime AssignedAtUtc { get; set; }
    public ExamQueryModel? Exam { get; set; }
}
