namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

public class CourseLessonQueryModel
{
    public long Id { get; set; }
    public string? LessonTitle { get; set; }
    public string? VideoTitle { get; set; }
    public string? VideoPath { get; set; }
    public string? WatermarkedVideoPath { get; set; }
    public int DurationSeconds { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public TeacherApprovalStatus VideoModerationStatus { get; set; } = TeacherApprovalStatus.Draft;
    public string? VideoRejectionNote { get; set; }

    public CourseSectionQueryModel? CourseSection { get; set; }
    public long CourseSectionId { get; set; }
    public long? MediaAssetId { get; set; }
}