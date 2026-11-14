using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetMyAssignedExams;

public class GetMyAssignedExamsQuery : IQuery<List<AssignedExamQri>>, IWebRequest
{
    public long UserId { get; set; }
    public string Path => "/api/Service/Exam/GetMyAssigned";
}

public class AssignedExamQri
{
    public long ExamId { get; set; }
    public long? AttemptId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public DateTime EndsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public decimal TotalPoints { get; set; }
    public byte AttemptStatus { get; set; }
    public decimal? FinalScore { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}
