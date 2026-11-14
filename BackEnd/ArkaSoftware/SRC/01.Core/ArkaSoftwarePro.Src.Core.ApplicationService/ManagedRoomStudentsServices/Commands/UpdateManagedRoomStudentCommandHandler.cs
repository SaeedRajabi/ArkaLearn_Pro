using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Commands;

public class UpdateManagedRoomStudentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IManagedRoomStudentCommandRepository repository,
    IRoomCommandRepository roomCommandRepository,
    IUserCommandRepository userCommandRepository)
    : CommandHandler<UpdateManagedRoomStudentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpdateManagedRoomStudentCommand command)
    {
        try
        {
            var entity = await repository.GetByIdOrDefaultAsync(command.Id);
            if (entity == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            var previousUserName = entity.UserName.Value;
            var previousEmail = entity.Email;

            entity.Update(
                command.FirstName,
                command.LastName,
                command.UserName,
                command.Email,
                command.Password,
                command.Phone,
                command.Notes,
                command.Gender,
                command.DateOfBirth,
                command.PhotoUrl);

            await roomCommandRepository.SyncAllRoomSeatsFromManagedStudentAsync(
                entity,
                previousUserName,
                previousEmail);

            if (!string.IsNullOrWhiteSpace(command.Password))
            {
                await roomCommandRepository.SyncRoomSeatPasswordHashesForManagedStudentAsync(
                    entity.Id,
                    entity.UserName.Value,
                    entity.Email,
                    entity.Password.HashedPassword,
                    entity.Password.Salt);

                var portalUser = userCommandRepository.FindByUserNameAsync(entity.UserName.Value);
                if (portalUser != null && portalUser.Id > 0)
                    portalUser.ResetPasswordByAdmin(command.Password);
            }

            await repository.CommitAsync();
            return await OkAsync("Updated");
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
