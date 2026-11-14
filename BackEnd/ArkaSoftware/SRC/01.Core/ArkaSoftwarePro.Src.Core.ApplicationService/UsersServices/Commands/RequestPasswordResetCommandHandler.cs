using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RequestPasswordReset;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class RequestPasswordResetCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPasswordResetService passwordResetService)
    : CommandHandler<RequestPasswordResetCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RequestPasswordResetCommand command)
    {
        try
        {
            await passwordResetService.RequestPasswordResetAsync(command.Email);
            return await OkAsync("If an account exists for this email, a reset link has been sent.");
        }
        catch (InvalidOperationException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(ex.Message, ApplicationServiceStatus.Exception);
        }
    }
}
