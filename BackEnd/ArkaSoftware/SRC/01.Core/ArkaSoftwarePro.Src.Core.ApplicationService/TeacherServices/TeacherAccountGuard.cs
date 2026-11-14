using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

internal static class TeacherAccountGuard
{
    public static string? GetContentManagementBlockReason(Teacher teacher) => teacher.AccountStatus switch
    {
        TeacherAccountStatus.Blocked => "Your teacher account is blocked. You cannot create or edit content.",
        TeacherAccountStatus.Terminated => "Your teacher account has been terminated. You cannot create or edit content.",
        _ => null,
    };
}
