using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ConfirmRemoteAssistConsent;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class ConfirmRemoteAssistConsentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    IRemoteAssistRealtimeNotifier realtimeNotifier)
    : CommandHandler<ConfirmRemoteAssistConsentCommand, RemoteAssistSessionQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionQri>> Handle(ConfirmRemoteAssistConsentCommand command)
    {
        if (command.OwnerUserId <= 0 || command.SessionId <= 0)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.ValidationError);

        var session = await repository.GetByIdAsync(command.SessionId);
        if (session is null)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.NotFound);

        if (session.RequesterUserId != command.OwnerUserId)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.InvalidDomainState);

        try
        {
            session.GrantConsent(new RemoteAssistPermissionSet(
                command.AllowRemoteControl,
                command.AllowClipboard,
                command.AllowFileTransfer,
                command.AllowAudio,
                command.AllowLockLocalInput));
        }
        catch (InvalidOperationException)
        {
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        await repository.CommitAsync();
        await realtimeNotifier.NotifyConsentResolvedAsync(
            RemoteAssistEventFactory.Build(session, "consent-granted"));
        await realtimeNotifier.NotifySessionAcceptedAsync(
            RemoteAssistEventFactory.Build(session, "accepted"));

        return await OkAsync(RemoteAssistMapper.ToQri(session));
    }
}

public class DenyRemoteAssistConsentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    IRemoteAssistRealtimeNotifier realtimeNotifier)
    : CommandHandler<DenyRemoteAssistConsentCommand, RemoteAssistSessionQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionQri>> Handle(DenyRemoteAssistConsentCommand command)
    {
        if (command.OwnerUserId <= 0 || command.SessionId <= 0)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.ValidationError);

        var session = await repository.GetByIdAsync(command.SessionId);
        if (session is null)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.NotFound);

        if (session.RequesterUserId != command.OwnerUserId)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.InvalidDomainState);

        var helperId = session.AcceptedByTeacherUserId;
        session.DenyConsent();
        await repository.CommitAsync();

        await realtimeNotifier.NotifyConsentResolvedAsync(
            RemoteAssistEventFactory.Build(session, "consent-denied"));

        if (helperId is > 0)
        {
            await realtimeNotifier.NotifyConsentResolvedAsync(new RemoteAssistSessionChangedEvent
            {
                SessionId = session.Id,
                RequesterUserId = session.RequesterUserId,
                AcceptedByTeacherUserId = helperId,
                OneTimeSessionCode = session.OneTimeSessionCode,
                SessionUsername = session.SessionUsername,
                Status = session.Status.ToString(),
                CreatedAtUtc = session.CreatedAtUtc.ToString("O"),
                CodeExpiresAtUtc = session.CodeExpiresAtUtc.ToString("O"),
                ChangeType = "consent-denied",
            });
        }

        return await OkAsync(RemoteAssistMapper.ToQri(session));
    }
}
