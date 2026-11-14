using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.AcceptRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class AcceptRemoteAssistSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    ISupportChatQueryRepository chatQueryRepository,
    IRemoteAssistRealtimeNotifier realtimeNotifier,
    IUserNotificationCommandRepository notificationRepository)
    : CommandHandler<AcceptRemoteAssistSessionCommand, RemoteAssistSessionAcceptedQri>(outer)
{
    public override async Task<CommandResult<RemoteAssistSessionAcceptedQri>> Handle(AcceptRemoteAssistSessionCommand command)
    {
        if (command.HelperUserId <= 0)
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.ValidationError);

        var code = command.OneTimeSessionCode?.Trim().ToUpperInvariant() ?? string.Empty;
        var username = command.SessionUsername?.Trim() ?? string.Empty;
        var password = command.SessionPassword?.Trim() ?? string.Empty;
        if (code.Length < 4 || username.Length < 3 || password.Length < 4)
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.ValidationError);

        var session = await repository.GetOpenByCodeAsync(code);
        if (session is null)
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.NotFound);

        session.ExpireIfNeeded(DateTime.UtcNow);
        if (!string.Equals(session.SessionUsername, username, StringComparison.OrdinalIgnoreCase))
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.ValidationError);

        if (!RemoteAssistSecurity.VerifyPassword(password, session.PasswordHash))
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.ValidationError);

        if (!command.ActorIsAdmin)
        {
            if (!await chatQueryRepository.IsTeacherAllowedForStudentAsync(session.RequesterUserId, command.HelperUserId))
                return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        if (session.Status == RemoteAssistSessionStatus.Active
            && session.AcceptedByTeacherUserId == command.HelperUserId)
        {
            return await OkAsync(new RemoteAssistSessionAcceptedQri
            {
                SessionId = session.Id,
                RequesterUserId = session.RequesterUserId,
                AcceptedByTeacherUserId = command.HelperUserId,
                Status = session.Status.ToString(),
                AcceptedAtUtc = session.AcceptedAtUtc ?? DateTime.UtcNow,
                ConsentRequestedAtUtc = session.ConsentRequestedAtUtc,
                Session = RemoteAssistMapper.ToQri(session),
            });
        }

        try
        {
            session.RequestConnect(command.HelperUserId);
        }
        catch (InvalidOperationException)
        {
            return await ResultAsync(new RemoteAssistSessionAcceptedQri(), ApplicationServiceStatus.InvalidDomainState);
        }

        await repository.CommitAsync();

        var evt = RemoteAssistEventFactory.Build(session, "consent-required");
        await realtimeNotifier.NotifyConsentRequiredAsync(evt);

        await notificationRepository.InsertManyAsync(
        [
            UserNotification.Create(
                session.RequesterUserId,
                "درخواست دسترسی از راه دور",
                "یک استاد یا پشتیبان درخواست اتصال به سیستم شما را دارد. دسترسی‌ها را تأیید یا رد کنید.",
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
