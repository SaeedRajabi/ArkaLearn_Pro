using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;
using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SessionsServices.Commands;

public class EndRoomSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomSessionCommandRepository repository,
    IEducationPlanConsumptionService educationPlanConsumption)
    : CommandHandler<EndRoomSessionCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(EndRoomSessionCommand command)
    {
        try
        {
            var session = await repository.GetActiveSessionForRoomAsync(command.RoomId);
            if (session! == null!)
            {
                return await OkAsync(true);
            }
            outer.CurrentUserContext.SetUserId(session.StartedByUserId ?? string.Empty);
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
        catch
        {
            return await ResultAsync(false, ApplicationServiceStatus.Exception);
        }
    }
}