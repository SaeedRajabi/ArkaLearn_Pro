using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourseCurriculumMaterial;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class DeleteCourseCurriculumMaterialCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCurriculumMaterialCommandRepository materialRepository,
    IMediaAssetCommandRepository mediaAssetRepository,
    ICourseQueriesRepository courseQueries,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeleteCourseCurriculumMaterialCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteCourseCurriculumMaterialCommand command)
    {
        if (command.MaterialId <= 0)
        {
            AddMessage("Invalid material.");
            return await ResultAsync("Invalid material.", ApplicationServiceStatus.ValidationError);
        }

        var material = await materialRepository.GetActiveByIdAsync(command.MaterialId);
        if (material is null)
        {
            AddMessage("Material not found.");
            return await ResultAsync("Material not found.", ApplicationServiceStatus.NotFound);
        }

        if (!await CanManageCourseAsync(material.CourseId))
        {
            AddMessage("Access denied.");
            return await ResultAsync("Access denied.", ApplicationServiceStatus.ValidationError);
        }

        var mediaAssetId = material.MediaAssetId;
        material.SoftDelete();
        await materialRepository.CommitAsync();

        try
        {
            var asset = await mediaAssetRepository.GetActiveByIdAsync(mediaAssetId);
            if (asset is not null)
            {
                asset.SoftDelete();
                await mediaAssetRepository.CommitAsync();
            }
        }
        catch
        {
            /* best effort */
        }

        return await OkAsync("Material deleted.");
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
