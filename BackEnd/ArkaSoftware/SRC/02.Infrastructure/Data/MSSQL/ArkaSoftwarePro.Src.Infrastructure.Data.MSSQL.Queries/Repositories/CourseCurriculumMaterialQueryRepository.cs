using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class CourseCurriculumMaterialQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext),
      ICourseCurriculumMaterialQueryRepository
{
    public async Task<List<CourseCurriculumMaterialQri>> ListByCourseAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        var rows = await (
            from m in dbContext.CourseCurriculumMaterials.AsNoTracking()
            join a in dbContext.MediaAssets.AsNoTracking() on m.MediaAssetId equals a.Id into assetJoin
            from a in assetJoin.DefaultIfEmpty()
            where m.CourseId == courseId && !m.IsDelete
            orderby m.CourseSectionId, m.CourseLessonId, m.SortOrder, m.Id
            select new CourseCurriculumMaterialQri
            {
                Id = m.Id,
                CourseId = m.CourseId,
                CourseSectionId = m.CourseSectionId,
                CourseLessonId = m.CourseLessonId,
                MediaAssetId = m.MediaAssetId,
                DisplayName = m.DisplayName,
                SortOrder = m.SortOrder,
                OriginalFileName = a != null ? a.OriginalFileName : null,
                FileSizeBytes = a != null ? a.FileSizeBytes : null,
                IsEncrypted = a != null && a.IsEncrypted,
            }).ToListAsync(cancellationToken);

        return rows;
    }

    public Task<List<CourseCurriculumMaterialQri>> ListByCourseForStudentAsync(
        long courseId,
        CancellationToken cancellationToken = default)
        => ListByCourseAsync(courseId, cancellationToken);
}
