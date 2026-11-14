using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ChangePassword;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class ChangePasswordCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserCommandRepository userCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ChangePasswordCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ChangePasswordCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var currentPassword = (command.CurrentPassword ?? string.Empty).Trim();
        var newPassword = (command.NewPassword ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
        {
            const string msg = "Current password and new password are required.";
            result.AddMessage(msg);
            return await ResultAsync(msg, ApplicationServiceStatus.ValidationError);
        }

        if (newPassword.Length < 6)
        {
            const string msg = "New password must be at least 6 characters.";
            result.AddMessage(msg);
            return await ResultAsync(msg, ApplicationServiceStatus.ValidationError);
        }

        if (string.Equals(currentPassword, newPassword, StringComparison.Ordinal))
        {
            const string msg = "New password must be different from the current password.";
            result.AddMessage(msg);
            return await ResultAsync(msg, ApplicationServiceStatus.ValidationError);
        }

        var user = await userCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

        try
        {
            user.ChangePassword(currentPassword, newPassword);
        }
        catch (InvalidOperationException ex)
        {
            result.AddMessage(ex.Message);
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await userCommandRepository.CommitAsync();
        return await OkAsync("Password changed successfully.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId) && userId > 0;
    }
}
