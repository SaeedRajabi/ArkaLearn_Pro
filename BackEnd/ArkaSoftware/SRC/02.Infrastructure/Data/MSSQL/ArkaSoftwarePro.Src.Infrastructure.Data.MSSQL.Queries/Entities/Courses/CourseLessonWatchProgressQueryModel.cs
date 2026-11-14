namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseLessonWatchProgressQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public long LessonId { get; set; }
    public int WatchedSeconds { get; set; }
    public int DurationSeconds { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime LastUpdatedUtc { get; set; }
}
