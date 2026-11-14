using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseCurriculumMaterials;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetCourseCurriculumMaterialsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCurriculumMaterialQueryRepository repository,
    ICourseQueriesRepository courseQueries,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCourseCurriculumMaterialsQuery, List<CourseCurriculumMaterialAdminQri>>(outer)
{
    public override async Task<QueryResult<List<CourseCurriculumMaterialAdminQri>>> Handle(
        GetCourseCurriculumMaterialsQuery query)
    {
        if (query.CourseId <= 0)
        {
            AddMessage("Course id is required.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        if (!await CanManageCourseAsync(query.CourseId))
        {
            AddMessage("Access denied.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        var rows = await repository.ListByCourseAsync(query.CourseId);
        var mapped = rows.Select(r => new CourseCurriculumMaterialAdminQri
        {
            Id = r.Id,
            CourseId = r.CourseId,
            CourseSectionId = r.CourseSectionId,
            CourseLessonId = r.CourseLessonId,
            MediaAssetId = r.MediaAssetId,
            DisplayName = r.DisplayName,
            SortOrder = r.SortOrder,
            OriginalFileName = r.OriginalFileName,
            FileSizeBytes = r.FileSizeBytes,
            IsEncrypted = r.IsEncrypted,
        }).ToList();

        return await ResultAsync(mapped);
    }

    private async Task<bool> CanManageCourseAsync(long courseId)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(user))
            return true;

        if (!TryGetUserId(out var userId))
            return false;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        if (!teacherId.HasValue)
            return false;

        var courseTeacherId = await courseQueries.GetCourseTeacherIdAsync(courseId);
        return courseTeacherId.HasValue && courseTeacherId.Value == teacherId.Value;
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
