using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminCreateUser;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Generator;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminCreateUserCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserUnitOfWork userUnitOfWork,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IUserWalletRepository userWalletRepository,
    IdGenerator idGenerator,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminCreateUserCommand, AdminCreateUserResult>(outer)
{
    public override async Task<CommandResult<AdminCreateUserResult>> Handle(AdminCreateUserCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new AdminCreateUserResult(), ApplicationServiceStatus.ValidationError);
        }

        if (command.UserRole != UserRole.STUDENT && command.UserRole != UserRole.TEACHER)
        {
            AddMessage("Invalid user role.");
            return await ResultAsync(new AdminCreateUserResult(), ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out var localPhone))
        {
            AddMessage("Phone number must be a valid Iranian mobile number.");
            return await ResultAsync(new AdminCreateUserResult(), ApplicationServiceStatus.ValidationError);
        }

        var userName = command.UserName.Trim();
        var email = command.Email.Trim().ToLowerInvariant();

        var conflict = await RegistrationDuplicateChecker.FindConflictAsync(
            userUnitOfWork.UserCommandRepository,
            email,
            userName,
            localPhone);
        if (conflict is not null)
        {
            var message = RegistrationDuplicateChecker.ToUserMessage(conflict);
            AddMessage(message);
            return await ResultAsync(new AdminCreateUserResult(), ApplicationServiceStatus.Exist);
        }

        var user = new User(
            new PId(idGenerator.Next()),
            new UserName(userName),
            command.Password,
            new Email(email),
            command.UserRole,
            command.AcceptedTerms);

        var (firstName, lastName) = DisplayNameSplitter.Split(command.FullName);
        user.UpdateUserFullName(firstName, lastName);
        user.SetPhoneNumber(IranianPhoneNormalizer.CountryCode, localPhone);
        user.VerifyPhoneNumber();

        long? studentId = null;
        long? teacherId = null;

        if (command.UserRole == UserRole.STUDENT)
        {
            var student = new Student(user.Id);
            await userUnitOfWork.StudentCommandRepository.InsertAsync(student);
            studentId = student.Id;

            await EnsureManagedRoomStudentAsync(user, firstName, lastName, userName, email, localPhone, command.Password);
        }
        else
        {
            var teacher = Teacher.Create(user.Id, string.Empty);
            await userUnitOfWork.TeacherCommandRepository.InsertAsync(teacher);
            teacherId = teacher.Id;

            var student = new Student(user.Id);
            await userUnitOfWork.StudentCommandRepository.InsertAsync(student);
            studentId = student.Id;
        }

        await userUnitOfWork.UserCommandRepository.InsertAsync(user);
        await userUnitOfWork.CommitAsync();

        await userWalletRepository.GetOrCreateByUserIdAsync(user.Id);

        return await OkAsync(new AdminCreateUserResult
        {
            UserId = user.Id,
            StudentId = studentId,
            TeacherId = teacherId,
        });
    }

    private async Task EnsureManagedRoomStudentAsync(
        User user,
        string firstName,
        string lastName,
        string userName,
        string email,
        string localPhone,
        string password)
    {
        var emailValue = user.Email.Value;
        var managedExists = await managedRoomStudentRepository.ExistsAsync(x =>
            x.UserName == user.UserName ||
            (!string.IsNullOrWhiteSpace(x.Email) &&
             !string.IsNullOrWhiteSpace(emailValue) &&
             x.Email!.Equals(emailValue)));

        if (managedExists)
            return;

        var phoneDisplay = $"0{localPhone}";
        var managed = ManagedRoomStudent.Create(
            firstName,
            lastName,
            userName,
            emailValue,
            password,
            phone: phoneDisplay,
            notes: "Created by admin",
            gender: null,
            dateOfBirth: null,
            photoUrl: null);
        await managedRoomStudentRepository.InsertAsync(managed);
    }
}
