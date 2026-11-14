using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Commands;

public interface ICourseCurriculumMaterialCommandRepository
    : ICommandRepository<CourseCurriculumMaterial, long>
{
    Task<CourseCurriculumMaterial?> GetActiveByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<CourseCurriculumMaterial>> ListActiveByCourseAsync(long courseId, CancellationToken cancellationToken = default);
    Task<int> GetNextSortOrderAsync(
        long courseId,
        long courseSectionId,
        long? courseLessonId,
        CancellationToken cancellationToken = default);
}
