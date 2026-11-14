using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.BlockDesktopDevice;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public class BlockDesktopDeviceCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<BlockDesktopDeviceCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(BlockDesktopDeviceCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        var device = await repository.GetDeviceRegistrationByIdAsync(command.DeviceRegistrationId);
        if (device is null)
            return await ResultAsync("Device not found.", ApplicationServiceStatus.NotFound);

        device.Block();
        await repository.CommitAsync();
        return await OkAsync("Device blocked.");
    }
}

public class UnblockDesktopDeviceCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UnblockDesktopDeviceCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UnblockDesktopDeviceCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        var device = await repository.GetDeviceRegistrationByIdAsync(command.DeviceRegistrationId);
        if (device is null)
            return await ResultAsync("Device not found.", ApplicationServiceStatus.NotFound);

        device.Unblock();
        await repository.CommitAsync();
        return await OkAsync("Device unblocked.");
    }
}

public class BlockDesktopUserAccessCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<BlockDesktopUserAccessCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(BlockDesktopUserAccessCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        if (command.UserId <= 0)
            return await ResultAsync("User id is required.", ApplicationServiceStatus.ValidationError);

        var active = await repository.GetActiveUserAccessBlockAsync(command.UserId);
        if (active is not null)
            return await ResultAsync("User already has an active desktop access block.", ApplicationServiceStatus.ValidationError);

        TryGetUserId(out var adminUserId);
        var block = DesktopAccessBlock.Create(command.UserId, command.Scope, command.Reason, adminUserId > 0 ? adminUserId : null);
        await repository.InsertAccessBlockAsync(block);
        await repository.CommitAsync();
        return await OkAsync("User desktop access blocked.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}

public class UnblockDesktopUserAccessCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UnblockDesktopUserAccessCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UnblockDesktopUserAccessCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        var block = await repository.GetAccessBlockByIdAsync(command.AccessBlockId);
        if (block is null || !block.IsActive)
            return await ResultAsync("Access block not found.", ApplicationServiceStatus.NotFound);

        block.Unblock();
        await repository.CommitAsync();
        return await OkAsync("User desktop access restored.");
    }
}
