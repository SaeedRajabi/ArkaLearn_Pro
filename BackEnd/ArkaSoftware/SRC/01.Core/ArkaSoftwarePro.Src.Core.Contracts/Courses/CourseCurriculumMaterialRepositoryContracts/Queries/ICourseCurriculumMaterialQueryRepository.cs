using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Queries;

public sealed class CourseCurriculumMaterialQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long CourseSectionId { get; set; }
    public long? CourseLessonId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? OriginalFileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public bool IsEncrypted { get; set; }
}

public interface ICourseCurriculumMaterialQueryRepository : IQueryRepository
{
    Task<List<CourseCurriculumMaterialQri>> ListByCourseAsync(
        long courseId,
        CancellationToken cancellationToken = default);

    Task<List<CourseCurriculumMaterialQri>> ListByCourseForStudentAsync(
        long courseId,
        CancellationToken cancellationToken = default);
}
