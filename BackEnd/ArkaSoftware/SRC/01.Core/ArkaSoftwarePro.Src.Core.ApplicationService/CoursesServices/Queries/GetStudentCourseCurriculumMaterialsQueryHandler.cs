using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetStudentCourseCurriculumMaterials;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetStudentCourseCurriculumMaterialsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCurriculumMaterialQueryRepository repository,
    ICourseQueriesRepository courseQueries,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetStudentCourseCurriculumMaterialsQuery, List<CourseCurriculumMaterialStudentQri>>(outer)
{
    public override async Task<QueryResult<List<CourseCurriculumMaterialStudentQri>>> Handle(
        GetStudentCourseCurriculumMaterialsQuery query)
    {
        if (query.CourseId <= 0 || !TryGetUserId(out var userId))
        {
            AddMessage("Unauthorized.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        if (!await courseQueries.HasActiveEnrollmentAsync(userId, query.CourseId))
        {
            AddMessage("Enrollment required.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        var delivery = await courseQueries.GetCourseDeliveryModeAsync(query.CourseId);
        // Desktop/SpotPlayer materials are DRM-only — not listed for web download.
        if (!CourseLifecycleRules.AllowsWebLessonVideoPlayback(delivery))
            return await ResultAsync([]);

        var rows = await repository.ListByCourseForStudentAsync(query.CourseId);
        var mapped = rows.Select(r => new CourseCurriculumMaterialStudentQri
        {
            Id = r.Id,
            CourseSectionId = r.CourseSectionId,
            CourseLessonId = r.CourseLessonId,
            MediaAssetId = r.MediaAssetId,
            DisplayName = r.DisplayName,
            OriginalFileName = r.OriginalFileName,
            FileSizeBytes = r.FileSizeBytes,
            DownloadUrl = r.IsEncrypted
                ? null
                : $"/api/Service/CourseMaterial/Download?materialId={r.Id}",
        }).ToList();

        return await ResultAsync(mapped);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
