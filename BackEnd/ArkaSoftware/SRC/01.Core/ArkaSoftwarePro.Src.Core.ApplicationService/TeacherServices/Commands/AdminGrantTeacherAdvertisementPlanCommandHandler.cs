using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAdvertisementPlan;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class AdminGrantTeacherAdvertisementPlanCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminGrantTeacherAdvertisementPlanCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminGrantTeacherAdvertisementPlanCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (command.TeacherUserId <= 0 || command.TariffId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(command.TeacherUserId);
        if (teacher == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var tariff = await teacherCommandRepository.GetTariffByIdAsync(command.TariffId);
        if (tariff == null || tariff.IsDelete || !tariff.IsActive)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        await entitlements.ActivateSubscriptionAsync(
            teacher,
            tariff,
            $"admin-grant-{DateTime.UtcNow.Ticks}");

        await teacherCommandRepository.CommitAsync();
        return await OkAsync("Advertisement plan assigned.");
    }
}
