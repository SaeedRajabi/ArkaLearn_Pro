using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Commands;

public class DeleteManagedRoomStudentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IManagedRoomStudentCommandRepository managedRepository,
    IRoomCommandRepository roomRepository,
    IManagedRoomStudentLinkedIdentityRemover linkedIdentityRemover)
    : CommandHandler<DeleteManagedRoomStudentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteManagedRoomStudentCommand command)
    {
        try
        {
            var entity = await managedRepository.GetByIdIncludingDeletedAsync(command.Id);
            if (entity == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            roomRepository.BeginTransaction();
            try
            {
                await roomRepository.RemoveRoomUsersWithManagedStudentIdAsync(command.Id);
                await linkedIdentityRemover.RemoveLinkedPortalIdentityAsync(entity);
                managedRepository.Delete(entity);
                await managedRepository.CommitAsync();
                roomRepository.CommitTransaction();
                return await OkAsync("Deleted");
            }
            catch
            {
                roomRepository.RollbackTransaction();
                throw;
            }
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
