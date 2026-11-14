using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ChangeRemoteAssistPassword;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class ChangeRemoteAssistPasswordCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository)
    : CommandHandler<ChangeRemoteAssistPasswordCommand, RemoteAssistSessionQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionQri>> Handle(ChangeRemoteAssistPasswordCommand command)
    {
        if (command.UserId <= 0 || command.SessionId <= 0)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.ValidationError);

        var session = await repository.GetByIdAsync(command.SessionId);
        if (session is null)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.NotFound);

        if (session.RequesterUserId != command.UserId)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.InvalidDomainState);

        var password = string.IsNullOrWhiteSpace(command.NewPassword)
            ? RemoteAssistSecurity.GenerateSessionPassword()
            : command.NewPassword.Trim();

        if (password.Length < 4)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.ValidationError);

        try
        {
            session.ChangePassword(RemoteAssistSecurity.HashPassword(password));
        }
        catch (InvalidOperationException)
        {
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        await repository.CommitAsync();
        return await OkAsync(RemoteAssistMapper.ToQri(session, password));
    }
}
