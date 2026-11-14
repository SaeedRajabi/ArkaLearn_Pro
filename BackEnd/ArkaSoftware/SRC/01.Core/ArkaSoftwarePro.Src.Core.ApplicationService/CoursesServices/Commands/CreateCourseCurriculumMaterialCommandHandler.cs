using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.CreateCourseCurriculumMaterial;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class CreateCourseCurriculumMaterialCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCurriculumMaterialCommandRepository materialRepository,
    ICourseCommandRepository courseRepository,
    ICourseQueriesRepository courseQueries,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<CreateCourseCurriculumMaterialCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(CreateCourseCurriculumMaterialCommand command)
    {
        if (!await CanManageCourseAsync(command.CourseId))
        {
            AddMessage("Access denied.");
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
        }

        if (command.CourseId <= 0 || command.CourseSectionId <= 0 || command.MediaAssetId <= 0)
        {
            AddMessage("Course, section, and media asset are required.");
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
        }

        var course = await courseRepository.GetAsync(command.CourseId);
        if (course is null || course.Id <= 0)
        {
            AddMessage("Course not found.");
            return await ResultAsync(0, ApplicationServiceStatus.NotFound);
        }

        var phase = course.GetEffectiveLifecyclePhase(DateTime.UtcNow);
        if (!CourseLifecycleRules.CanUploadLessonVideos(course.DeliveryMode, phase))
        {
            AddMessage("Materials can only be uploaded while the course is in progress.");
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
        }

        var displayName = string.IsNullOrWhiteSpace(command.DisplayName)
            ? $"material-{command.MediaAssetId}"
            : command.DisplayName.Trim();

        var sort = await materialRepository.GetNextSortOrderAsync(
            command.CourseId,
            command.CourseSectionId,
            command.CourseLessonId);

        var entity = CourseCurriculumMaterial.Create(
            command.CourseId,
            command.CourseSectionId,
            command.CourseLessonId,
            command.MediaAssetId,
            displayName,
            sort);

        await materialRepository.InsertAsync(entity);
        await materialRepository.CommitAsync();
        return await OkAsync(entity.Id);
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
