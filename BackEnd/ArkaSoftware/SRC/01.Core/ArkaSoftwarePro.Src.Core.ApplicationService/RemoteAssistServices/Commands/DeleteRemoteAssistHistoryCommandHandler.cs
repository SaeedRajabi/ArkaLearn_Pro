using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.DeleteRemoteAssistHistory;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class DeleteRemoteAssistHistoryCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    ISupportChatQueryRepository chatQueryRepository,
    IRemoteAssistRealtimeNotifier realtimeNotifier)
    : CommandHandler<DeleteRemoteAssistHistoryCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteRemoteAssistHistoryCommand command)
    {
        if (command.ActorUserId <= 0)
            return await ResultAsync("درخواست نامعتبر است.", ApplicationServiceStatus.ValidationError);

        if (command.SessionId is > 0)
            return await DeleteOneAsync(command);

        return await DeleteManyAsync(command);
    }

    private async Task<CommandResult<string>> DeleteOneAsync(DeleteRemoteAssistHistoryCommand command)
    {
        var session = await repository.GetByIdAsync(command.SessionId!.Value);
        if (session is null)
            return await ResultAsync("نشست مورد نظر یافت نشد.", ApplicationServiceStatus.NotFound);

        if (!CanAccess(command, session))
            return await ResultAsync("اجازه حذف این نشست را ندارید.", ApplicationServiceStatus.NotFound);

        var wasOpen = session.Status is RemoteAssistSessionStatus.Pending
            or RemoteAssistSessionStatus.AwaitingConsent
            or RemoteAssistSessionStatus.Active;

        session.SoftDelete();
        await repository.CommitAsync();

        if (wasOpen)
        {
            await realtimeNotifier.NotifySessionEndedAsync(
                RemoteAssistEventFactory.Build(session, "ended"));
        }

        return await OkAsync("1");
    }

    private async Task<CommandResult<string>> DeleteManyAsync(DeleteRemoteAssistHistoryCommand command)
    {
        long? ownerFilter = null;
        long? helperFilter = null;

        if (command.ActorIsAdmin)
        {
            ownerFilter = command.StudentUserId is > 0 ? command.StudentUserId : null;
            helperFilter = command.TeacherUserId is > 0 ? command.TeacherUserId : null;
        }
        else if (command.ActorIsTeacher)
        {
            helperFilter = command.ActorUserId;
            if (command.StudentUserId is > 0)
            {
                if (!await chatQueryRepository.IsTeacherAllowedForStudentAsync(command.StudentUserId.Value, command.ActorUserId))
                    return await ResultAsync("اجازه دسترسی به این دانشجو را ندارید.", ApplicationServiceStatus.NotFound);
                ownerFilter = command.StudentUserId;
            }
        }
        else
        {
            ownerFilter = command.ActorUserId;
        }

        var sessions = await repository.ListForSoftDeleteAsync(ownerFilter, helperFilter);
        if (sessions.Count == 0)
            return await OkAsync("0");

        var openSessions = sessions
            .Where(s => s.Status is RemoteAssistSessionStatus.Pending
                or RemoteAssistSessionStatus.AwaitingConsent
                or RemoteAssistSessionStatus.Active)
            .ToList();

        foreach (var session in sessions)
            session.SoftDelete();

        await repository.CommitAsync();

        foreach (var session in openSessions)
        {
            await realtimeNotifier.NotifySessionEndedAsync(
                RemoteAssistEventFactory.Build(session, "ended"));
        }

        return await OkAsync(sessions.Count.ToString());
    }

    private static bool CanAccess(DeleteRemoteAssistHistoryCommand command, RemoteAssistSession session)
    {
        if (command.ActorIsAdmin) return true;
        if (command.ActorIsTeacher && session.AcceptedByTeacherUserId == command.ActorUserId) return true;
        return session.RequesterUserId == command.ActorUserId;
    }
}
