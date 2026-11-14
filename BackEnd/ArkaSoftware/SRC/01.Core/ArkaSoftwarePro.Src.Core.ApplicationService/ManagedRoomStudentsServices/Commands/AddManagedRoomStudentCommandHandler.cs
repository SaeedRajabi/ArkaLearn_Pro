using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Generator;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ManagedRoomStudentsServices.Commands;

public class AddManagedRoomStudentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IManagedRoomStudentCommandRepository repository,
    IUserUnitOfWork userUnitOfWork,
    IdGenerator idGenerator)
    : CommandHandler<AddManagedRoomStudentCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(AddManagedRoomStudentCommand command)
    {
        try
        {
            var entity = ManagedRoomStudent.Create(
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
            await repository.InsertAsync(entity);
            await repository.CommitAsync();

            // Create User and Student if they don't exist
            var emailObj = string.IsNullOrWhiteSpace(command.Email) ? null : new Email(command.Email);
            var userNameObj = new UserName(command.UserName);
            
            bool isUserExist = await userUnitOfWork.UserCommandRepository.ExistsAsync(x => 
                x.UserName == userNameObj || (emailObj != null && x.Email == emailObj));
                
            if (!isUserExist)
            {
                var user = new User(
                    new PId(idGenerator.Next()),
                    userNameObj,
                    command.Password,
                    emailObj ?? new Email("no-email@arkalearn.com"),
                    UserRole.STUDENT,
                    true);
                
                await userUnitOfWork.UserCommandRepository.InsertAsync(user);
                await userUnitOfWork.StudentCommandRepository.InsertAsync(new Student(user.Id));
                await userUnitOfWork.CommitAsync();
            }

            return await OkAsync(entity.Id);
        }
        catch
        {
            return await ResultAsync(default(long), ApplicationServiceStatus.Exception);
        }
    }
}
