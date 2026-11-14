using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SessionsServices.Commands;

public class StartRoomSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomSessionCommandRepository repository)
    : CommandHandler<StartRoomSessionCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(StartRoomSessionCommand command)
    {
        try
        {
            var existing = await repository.GetActiveSessionForRoomAsync(command.RoomId);
            if (existing != null)
            {
                return await OkAsync(existing.Id);
            }

            var session = RoomSession.Start(command.RoomId, command.StartedByUserId);
            await repository.InsertAsync(session);
            await repository.CommitAsync();

            return await OkAsync(session.Id);
        }
        catch
        {
            return await ResultAsync(default(long), ApplicationServiceStatus.Exception);
        }
    }
}