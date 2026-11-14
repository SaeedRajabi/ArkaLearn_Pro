using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAutoBumpPlan;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class AdminGrantTeacherAutoBumpPlanCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    AdvertisementBumpService bumpService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminGrantTeacherAutoBumpPlanCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminGrantTeacherAutoBumpPlanCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (command.TeacherUserId <= 0 || command.PackageId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(command.TeacherUserId);
        if (teacher == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var package = await teacherCommandRepository.GetAutoBumpPackageByIdAsync(command.PackageId);
        if (package == null || package.IsDelete || !package.IsActive)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var now = DateTime.UtcNow;
        var purchase = TeacherAdvertisementAutoBumpPurchase.Create(
            teacher.Id,
            package.Id,
            0,
            package.DurationDays,
            now,
            $"admin-grant-{now.Ticks}");

        await teacherCommandRepository.AddAutoBumpPurchaseAsync(purchase);
        await bumpService.BumpTeacherListingAsync(teacher);
        purchase.MarkAutoBumpExecuted(now);
        await teacherCommandRepository.CommitAsync();

        return await OkAsync("Auto bump plan assigned.");
    }
}
