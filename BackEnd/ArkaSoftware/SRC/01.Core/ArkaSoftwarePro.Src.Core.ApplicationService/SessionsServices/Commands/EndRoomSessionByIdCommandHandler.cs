using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SessionsServices.Commands;

public class EndRoomSessionByIdCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomSessionCommandRepository repository,
    IMeetingLifecycleService meetingLifecycle,
    IEducationPlanConsumptionService educationPlanConsumption)
    : CommandHandler<EndRoomSessionByIdCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(EndRoomSessionByIdCommand command)
    {
        var session = await repository.GetSessionByIdAsync(command.SessionId, command.RoomId);
        if (session == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        if (session.Status == "Active")
        {
            await meetingLifecycle.EndRoomMeetingAsync(command.RoomId, "admin_end_session");
            return await OkAsync(true);
        }

        var start = session.StartTime;
        var isIgnored = session.IsIgnored;
        session.End();
        var end = session.EndTime ?? DateTime.UtcNow;
        var sessionId = session.Id;
        var roomId = session.RoomId;
        await repository.CommitAsync();

        await educationPlanConsumption.ApplyRoomSessionEndedAsync(
            roomId,
            sessionId,
            start,
            end,
            isIgnored);

        return await OkAsync(true);
    }
}
