using ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.EndRemoteAssistSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices.Commands;

public class EndRemoteAssistSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRemoteAssistCommandRepository repository,
    IRemoteAssistRealtimeNotifier realtimeNotifier)
    : CommandHandler<EndRemoteAssistSessionCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(EndRemoteAssistSessionCommand command)
    {
        if (command.UserId <= 0 || command.SessionId <= 0)
            return await ResultAsync("Invalid request.", ApplicationServiceStatus.ValidationError);

        var session = await repository.GetByIdAsync(command.SessionId);
        if (session is null)
            return await ResultAsync("Session not found.", ApplicationServiceStatus.NotFound);

        var isParticipant = session.RequesterUserId == command.UserId
            || session.AcceptedByTeacherUserId == command.UserId;
        if (!isParticipant)
            return await ResultAsync("Access denied.", ApplicationServiceStatus.InvalidDomainState);

        if (session.Status is not (RemoteAssistSessionStatus.Pending
            or RemoteAssistSessionStatus.AwaitingConsent
            or RemoteAssistSessionStatus.Active))
            return await OkAsync("already-ended");

        session.End();
        await repository.CommitAsync();

        await realtimeNotifier.NotifySessionEndedAsync(
            RemoteAssistEventFactory.Build(session, "ended"));

        return await OkAsync("ended");
    }
}
