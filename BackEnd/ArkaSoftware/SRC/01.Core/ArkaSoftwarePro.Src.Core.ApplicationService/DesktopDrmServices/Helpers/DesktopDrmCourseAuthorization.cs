using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;

public static class DesktopDrmCourseAuthorization
{
    /// <summary>
    /// Legacy SpotPlayer courses are treated as Arka desktop-license delivery.
    /// </summary>
    public static bool IsArkaDesktopDelivery(CourseDeliveryMode? mode) =>
        mode is CourseDeliveryMode.DesktopLicense or CourseDeliveryMode.SpotPlayerLicense;

    public static async Task<bool> CanManageCourseAsync(
        long requestingUserId,
        long? courseTeacherId,
        ITeacherQueryRepository teacherQueryRepository,
        IHttpContextAccessor httpContextAccessor,
        Action<string>? addMessage = null)
    {
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return true;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(requestingUserId);
        if (!teacherId.HasValue || courseTeacherId != teacherId.Value)
        {
            addMessage?.Invoke("Access denied.");
            return false;
        }

        return true;
    }
}
