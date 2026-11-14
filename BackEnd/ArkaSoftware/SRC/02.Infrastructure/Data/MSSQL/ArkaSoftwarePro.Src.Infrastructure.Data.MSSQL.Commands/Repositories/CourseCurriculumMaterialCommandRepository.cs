using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class CourseCurriculumMaterialCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<CourseCurriculumMaterial, ArkaSoftwareCommandDbContext>(dbContext),
      ICourseCurriculumMaterialCommandRepository
{
    public Task<CourseCurriculumMaterial?> GetActiveByIdAsync(
        long id,
        CancellationToken cancellationToken = default)
        => _dbContext.CourseCurriculumMaterials
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete, cancellationToken);

    public Task<List<CourseCurriculumMaterial>> ListActiveByCourseAsync(
        long courseId,
        CancellationToken cancellationToken = default)
        => _dbContext.CourseCurriculumMaterials
            .Where(x => x.CourseId == courseId && !x.IsDelete)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

    public async Task<int> GetNextSortOrderAsync(
        long courseId,
        long courseSectionId,
        long? courseLessonId,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CourseCurriculumMaterials
            .Where(x => !x.IsDelete && x.CourseId == courseId && x.CourseSectionId == courseSectionId);

        query = courseLessonId.HasValue
            ? query.Where(x => x.CourseLessonId == courseLessonId.Value)
            : query.Where(x => x.CourseLessonId == null);

        var max = await query.Select(x => (int?)x.SortOrder).MaxAsync(cancellationToken);
        return (max ?? -1) + 1;
    }
}
