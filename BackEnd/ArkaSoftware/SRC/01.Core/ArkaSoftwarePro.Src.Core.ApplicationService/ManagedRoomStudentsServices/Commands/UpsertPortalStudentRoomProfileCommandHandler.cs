using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands.UpsertPortalStudentRoomProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Commands;

public class UpsertPortalStudentRoomProfileCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository,
    IUserQueryRepository userQueryRepository,
    IUserCommandRepository userCommandRepository,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IRoomCommandRepository roomCommandRepository)
    : CommandHandler<UpsertPortalStudentRoomProfileCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(UpsertPortalStudentRoomProfileCommand command)
    {
        if (command.TeacherUserId <= 0 || command.PortalUserId <= 0)
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        if (!await courseQueriesRepository.IsPortalUserInTeacherScopeAsync(
                command.TeacherUserId,
                command.PortalUserId))
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.PortalUserId });
        if (user == null)
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var portalUser = await userCommandRepository.GetAsync(command.PortalUserId);
        if (portalUser == null)
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var email = user.Email?.Trim();
        var phone = user.PhoneNumber?.Trim();
        var roomUserName = command.RoomUserName.Trim();
        var firstName = command.FirstName.Trim();
        var lastName = command.LastName.Trim();

        if (string.IsNullOrWhiteSpace(roomUserName) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        portalUser.UpdateUserFullName(firstName, lastName);

        var existingId = await courseQueriesRepository.FindManagedRoomStudentIdByPortalUserIdAsync(command.PortalUserId);

        if (existingId is > 0)
        {
            var entity = await managedRoomStudentRepository.GetByIdOrDefaultAsync(existingId.Value);
            if (entity == null)
                return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

            var previousUserName = entity.UserName.Value;
            var previousEmail = entity.Email;
            var password = string.IsNullOrWhiteSpace(command.Password) ? null : command.Password.Trim();

            entity.Update(
                firstName,
                lastName,
                roomUserName,
                email,
                password,
                phone,
                entity.Notes,
                entity.Gender,
                entity.DateOfBirth,
                entity.PhotoUrl);

            await roomCommandRepository.SyncAllRoomSeatsFromManagedStudentAsync(entity, previousUserName, previousEmail);

            if (!string.IsNullOrWhiteSpace(password))
            {
                await roomCommandRepository.SyncRoomSeatPasswordHashesForManagedStudentAsync(
                    entity.Id,
                    entity.UserName.Value,
                    entity.Email,
                    entity.Password.HashedPassword,
                    entity.Password.Salt);
            }

            await userCommandRepository.CommitAsync();
            return await OkAsync(entity.Id);
        }

        var newPassword = command.Password?.Trim();
        if (string.IsNullOrWhiteSpace(newPassword))
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        var created = ManagedRoomStudent.Create(
            firstName,
            lastName,
            roomUserName,
            email,
            newPassword,
            phone,
            notes: null,
            gender: null,
            dateOfBirth: null,
            photoUrl: null);

        await managedRoomStudentRepository.InsertAsync(created);
        await userCommandRepository.CommitAsync();
        return await OkAsync(created.Id);
    }
}
