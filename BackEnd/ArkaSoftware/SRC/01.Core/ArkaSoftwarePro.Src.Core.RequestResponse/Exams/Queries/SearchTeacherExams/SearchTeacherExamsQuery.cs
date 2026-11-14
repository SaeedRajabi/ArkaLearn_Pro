using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.SearchTeacherExams;

public class SearchTeacherExamsQuery : PageQuery<PagedData<SearchTeacherExamQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long? CourseId { get; set; }
    public string? InputValue { get; set; }
    public string Path => "/api/Service/Exam/SearchTeacher";
}

public class SearchTeacherExamQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public DateTime EndsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public byte Status { get; set; }
    public decimal TotalPoints { get; set; }
    public int AssignedCount { get; set; }
    public int SubmittedCount { get; set; }
    public int GradedCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
