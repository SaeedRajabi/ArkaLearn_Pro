using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.DeleteUser;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class DeleteUserCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserCommandRepository userRepository,
    IManagedRoomStudentCommandRepository managedRepository,
    IRoomCommandRepository roomRepository,
    IUserPortalAccountRemover userPortalAccountRemover)
    : CommandHandler<DeleteUserCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteUserCommand command)
    {
        if (command.UserId <= 0)
        {
            AddMessage("Invalid user id.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var user = await userRepository.GetAsync(command.UserId);
        if (user == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (user.Role == UserRole.ADMIN)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var managed = await managedRepository.FindActiveByUserNameOrEmailAsync(
            user.UserName.Value,
            user.Email.Value);

        roomRepository.BeginTransaction();
        try
        {
            if (managed != null)
            {
                await roomRepository.RemoveRoomUsersWithManagedStudentIdAsync(managed.Id);
                managedRepository.Delete(managed);
                await managedRepository.CommitAsync();
            }

            await userPortalAccountRemover.RemoveUserByIdAsync(user.Id);
            await userRepository.CommitAsync();

            roomRepository.CommitTransaction();
            return await OkAsync("Deleted");
        }
        catch
        {
            roomRepository.RollbackTransaction();
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
