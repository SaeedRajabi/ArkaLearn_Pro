using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ResetPassword;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class ResetPasswordCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPasswordResetService passwordResetService)
    : CommandHandler<ResetPasswordCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ResetPasswordCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Token) || string.IsNullOrWhiteSpace(command.NewPassword))
            return await ResultAsync("Token and new password are required.", ApplicationServiceStatus.ValidationError);

        var success = await passwordResetService.ResetPasswordAsync(command.Token, command.NewPassword);
        if (!success)
            return await ResultAsync("Invalid or expired reset token.", ApplicationServiceStatus.ValidationError);

        return await OkAsync("Password has been reset successfully.");
    }
}
