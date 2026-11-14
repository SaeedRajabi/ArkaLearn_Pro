using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Queries;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;

public sealed class ManagedRoomStudentAccessService(IManagedRoomStudentQueryRepository queryRepository)
{
    public Task<bool> CanManageAsync(ClaimsPrincipal user, long managedStudentId, CancellationToken cancellationToken = default)
    {
        if (managedStudentId <= 0)
            return Task.FromResult(false);

        if (user.IsDashboardAdminRole())
            return Task.FromResult(true);

        if (!user.TryGetLongUserId(out var teacherUserId))
            return Task.FromResult(false);

        return queryRepository.IsInTeacherScopeAsync(teacherUserId, managedStudentId, cancellationToken);
    }

    public bool CanCreate(ClaimsPrincipal user) =>
        user.IsDashboardAdminRole() || user.IsStaffProfessorRole();
}
