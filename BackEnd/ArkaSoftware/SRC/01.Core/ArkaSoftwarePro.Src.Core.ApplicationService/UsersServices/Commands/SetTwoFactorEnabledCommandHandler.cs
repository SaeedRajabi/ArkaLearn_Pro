using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetTwoFactorEnabled;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class SetTwoFactorEnabledCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserCommandRepository userCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SetTwoFactorEnabledCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SetTwoFactorEnabledCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var user = await userCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

        if (command.Enabled)
        {
            var hasVerifiedPhone = user.PhoneNumber is not null
                && !string.IsNullOrWhiteSpace(user.PhoneNumber.Number)
                && user.PhoneNumberVerified;
            var hasEmail = user.Email is not null && !string.IsNullOrWhiteSpace(user.Email.Value);

            if (!hasVerifiedPhone && !hasEmail)
            {
                const string msg = "Add a verified phone number or an email address before enabling two-factor authentication.";
                result.AddMessage(msg);
                return await ResultAsync(msg, ApplicationServiceStatus.ValidationError);
            }

            user.EnableTwoFactorAuthentication();
        }
        else
        {
            user.DisableTwoFactorAuthentication();
        }

        await userCommandRepository.CommitAsync();
        return await OkAsync(command.Enabled ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
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
