using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.AcceptRemoteAssistSession;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ReconnectRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class ReconnectRemoteAssistSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    ISupportChatQueryRepository chatQueryRepository,
    IRemoteAssistRealtimeNotifier realtimeNotifier,
    IUserNotificationCommandRepository notificationRepository)
    : CommandHandler<ReconnectRemoteAssistSessionCommand, RemoteAssistSessionAcceptedQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionAcceptedQri>> Handle(
        ReconnectRemoteAssistSessionCommand command)
    {
        if (command.HelperUserId <= 0 || command.StudentUserId <= 0)
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.ValidationError);

        if (!command.ActorIsAdmin
            && !await chatQueryRepository.IsTeacherAllowedForStudentAsync(command.StudentUserId, command.HelperUserId))
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.InvalidDomainState);

        var session = await repository.GetOpenSessionForOwnerAsync(command.StudentUserId);
        if (session is null)
        {
            AddMessage("Student does not have an open remote-assist session. Ask them to open Remote Assist in the desktop app.");
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.NotFound);
        }

        session.ExpireIfNeeded(DateTime.UtcNow);
        if (session.Status is RemoteAssistSessionStatus.Expired
            or RemoteAssistSessionStatus.Ended
            or RemoteAssistSessionStatus.Rejected)
        {
            AddMessage("Student session is closed. Ask them to open Remote Assist again.");
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        try
        {
            if (session.Status == RemoteAssistSessionStatus.Pending)
                session.RequestConnect(command.HelperUserId);
            else
                session.ReRequestConsent(command.HelperUserId);
        }
        catch (InvalidOperationException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        await repository.CommitAsync();

        var evt = RemoteAssistEventFactory.Build(session, "consent-required");
        await realtimeNotifier.NotifyConsentRequiredAsync(evt);

        await notificationRepository.InsertManyAsync(
        [
            UserNotification.Create(
                session.RequesterUserId,
                "درخواست مجدد دسترسی از راه دور",
                "استاد می‌خواهد دوباره به نشست کمک از راه دور متصل شود. دسترسی‌ها را تأیید یا رد کنید.",
                "remote-assist-consent",
                "/account/remote-assist",
                session.Id)
        ]);
        await notificationRepository.CommitAsync();

        return await OkAsync(new RemoteAssistSessionAcceptedQri
        {
            SessionId = session.Id,
            RequesterUserId = session.RequesterUserId,
            AcceptedByTeacherUserId = command.HelperUserId,
            Status = session.Status.ToString(),
            AcceptedAtUtc = DateTime.UtcNow,
            ConsentRequestedAtUtc = session.ConsentRequestedAtUtc,
            Session = RemoteAssistMapper.ToQri(session),
        });
    }
}
