using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AssignManagedStudentsToRoom;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class AssignManagedStudentsToRoomCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IManagedRoomStudentCommandRepository managedRepository)
    : CommandHandler<AssignManagedStudentsToRoomCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AssignManagedStudentsToRoomCommand command)
    {
        try
        {
            var room = await roomRepository.GetWithRoomUsersAsync(command.RoomId);
                if (room == null)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

                var desired = command.ManagedStudentIds.Where(x => x > 0).Distinct().ToHashSet();
                room.RemoveManagedRoomUsersNotIn(desired);

                foreach (var id in desired)
                {
                    var managed = await managedRepository.GetByIdOrDefaultAsync(id);
                    if (managed == null)
                        continue;

                    room.AssignOrSyncManagedStudentSeat(managed, null);
                }

            await roomRepository.CommitAsync();
            return await OkAsync("Assigned");
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
