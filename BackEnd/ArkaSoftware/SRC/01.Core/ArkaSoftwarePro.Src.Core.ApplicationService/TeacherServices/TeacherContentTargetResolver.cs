using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public static class TeacherContentTargetResolver
{
    public static bool TryGetAuthenticatedUserId(IHttpContextAccessor httpContextAccessor, out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }

    public static async Task<Teacher?> ResolveTeacherForContentEditAsync(
        long? teacherUserId,
        IHttpContextAccessor httpContextAccessor,
        IUserCommandRepository userCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        IStudentCommandRepository studentCommandRepository,
        long? teacherId = null)
    {
        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
        if (isAdmin && teacherUserId is > 0)
        {
            return await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
                teacherUserId.Value,
                userCommandRepository,
                teacherCommandRepository,
                studentCommandRepository);
        }

        if (isAdmin && teacherId is > 0)
            return await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId.Value);

        if (!TryGetAuthenticatedUserId(httpContextAccessor, out var userId))
            return null;

        return await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository);
    }

    public static async Task<Teacher?> ResolveTeacherForAdminReadAsync(
        long? teacherUserId,
        long? teacherId,
        IHttpContextAccessor httpContextAccessor,
        ITeacherCommandRepository teacherCommandRepository)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return null;

        if (teacherUserId is > 0)
            return await teacherCommandRepository.GetByUserIdWithDetailsAsync(teacherUserId.Value);

        if (teacherId is > 0)
            return await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId.Value);

        return null;
    }

    /// <summary>
    /// Admin edit listing with no teacher filter — return content across all teachers.
    /// </summary>
    public static bool IsAdminListingAllTeachersContent(
        bool forEdit,
        long? teacherUserId,
        long? teacherId,
        string? userName,
        ClaimsPrincipal? user)
    {
        return forEdit
            && DashboardAdminRoleChecker.IsDashboardAdminRole(user)
            && teacherUserId is not > 0
            && teacherId is not > 0
            && string.IsNullOrWhiteSpace(userName);
    }
}
