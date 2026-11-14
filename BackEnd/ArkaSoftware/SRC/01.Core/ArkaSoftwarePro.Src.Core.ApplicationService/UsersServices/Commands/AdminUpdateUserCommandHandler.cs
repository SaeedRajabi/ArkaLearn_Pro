using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminUpdateUser;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminUpdateUserCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserCommandRepository userRepository,
    IManagedRoomStudentCommandRepository managedRepository,
    IRoomCommandRepository roomCommandRepository)
    : CommandHandler<AdminUpdateUserCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminUpdateUserCommand command)
    {
        var user = await userRepository.GetAsync(command.UserId);
        if (user == null!)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!string.IsNullOrWhiteSpace(command.FirstName) || !string.IsNullOrWhiteSpace(command.LastName))
        {
            user.UpdateUserFullName(
                command.FirstName ?? user.UserFullName?.FirstName ?? user.UserName.Value,
                command.LastName ?? user.UserFullName?.LastName ?? user.UserName.Value);
        }

        if (!string.IsNullOrWhiteSpace(command.Password))
            user.ResetPasswordByAdmin(command.Password);

        var managed = await managedRepository.FindActiveByUserNameOrEmailAsync(
            user.UserName.Value,
            user.Email.Value);
        if (managed != null)
        {
            managed.Update(
                command.FirstName ?? managed.FirstName,
                command.LastName ?? managed.LastName,
                managed.UserName.Value,
                command.Email ?? managed.Email,
                command.Password,
                managed.Phone,
                managed.Notes,
                managed.Gender,
                managed.DateOfBirth,
                managed.PhotoUrl);

            await roomCommandRepository.SyncAllRoomSeatsFromManagedStudentAsync(managed);

            if (!string.IsNullOrWhiteSpace(command.Password))
                await roomCommandRepository.SyncRoomSeatPasswordHashesForManagedStudentAsync(
                    managed.Id,
                    managed.UserName.Value,
                    managed.Email,
                    managed.Password.HashedPassword,
                    managed.Password.Salt);
        }

        await userRepository.CommitAsync();
        return await OkAsync("Updated");
    }
}
