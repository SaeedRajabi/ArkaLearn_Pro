using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

/// <summary>Ensure student has a single open listening session (ID + username + password).</summary>
public class RequestRemoteAssistSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    IRemoteAssistRealtimeNotifier realtimeNotifier)
    : CommandHandler<RequestRemoteAssistSessionCommand, RemoteAssistSessionQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionQri>> Handle(RequestRemoteAssistSessionCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync(new RemoteAssistSessionQri(), ApplicationServiceStatus.ValidationError);

        var now = DateTime.UtcNow;
        var existing = await repository.GetOpenSessionForOwnerAsync(command.UserId);
        if (existing is not null)
        {
            existing.ExpireIfNeeded(now);
            if (existing.Status is RemoteAssistSessionStatus.Pending
                or RemoteAssistSessionStatus.AwaitingConsent
                or RemoteAssistSessionStatus.Active)
            {
                existing.ExtendOpenWindow();
                await repository.CommitAsync();
                // Password not re-sent for existing sessions (use ChangePassword to rotate).
                return await OkAsync(RemoteAssistMapper.ToQri(existing));
            }
        }

        string code;
        do
        {
            code = RemoteAssistSecurity.GenerateSessionCode();
        } while (await repository.GetOpenByCodeAsync(code) is not null);

        var username = RemoteAssistSecurity.GenerateSessionUsername(command.UserId);
        var password = RemoteAssistSecurity.GenerateSessionPassword();
        var hash = RemoteAssistSecurity.HashPassword(password);

        var session = RemoteAssistSession.CreateOpen(command.UserId, code, username, hash);
        await repository.InsertAsync(session);
        await repository.CommitAsync();

        await realtimeNotifier.NotifySessionRequestedAsync(
            RemoteAssistEventFactory.Build(session, "ensured"));

        return await OkAsync(RemoteAssistMapper.ToQri(session, password));
    }
}
