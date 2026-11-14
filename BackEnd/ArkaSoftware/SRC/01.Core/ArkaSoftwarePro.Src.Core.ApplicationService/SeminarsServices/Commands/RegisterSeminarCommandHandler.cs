using System.Security.Claims;
using System.Security.Cryptography;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    /// <summary>
    /// ثبت‌نام کاربر در سمینار؛ در صورت اتصال سمینار به اتاق، کاربر به اتاق اضافه می‌شود
    /// (نام کاربری = ایمیل، رمز تصادفی قوی) و اطلاعات ورود به ایمیل ارسال می‌شود.
    /// </summary>
    public class RegisterSeminarCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository,
        IRoomCommandRepository roomCommandRepository,
        IManagedRoomStudentCommandRepository managedRoomStudentRepository,
        IUserQueryRepository userQueryRepository,
        ITransactionalEmailNotifier transactionalEmailNotifier,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<RegisterSeminarCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(RegisterSeminarCommand command)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

            var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
            if (user == null)
                return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

            var seminar = await seminarCommandRepository.GetAsync(command.SeminarId);
            if (seminar == null!)
                return await ResultAsync($"Seminar With Id : {command.SeminarId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            if (!seminar.RoomId.HasValue)
                return await ResultAsync("This seminar does not have an assigned online room.", ApplicationServiceStatus.NotFound);

            if (IsSeminarExpired(seminar.EndTime))
                return await ResultAsync("This seminar has expired.", ApplicationServiceStatus.NotFound);

            if (!seminar.CanAcceptRegistration(DateTime.UtcNow))
                return await ResultAsync("Registration is not available for this seminar.", ApplicationServiceStatus.NotFound);

            seminar.RegisterUser(userId, command.HasPaid);

            if (seminar.RoomId.HasValue)
            {
                var room = await roomCommandRepository.GetWithRoomUsersAsync(seminar.RoomId.Value);
                if (room! != null!)
                {
                    var email = (user.Email ?? "").Trim();
                    var userName = (user.UserName ?? "").Trim();
                    var managed = await managedRoomStudentRepository.FindActiveByUserNameOrEmailAsync(userName, email);

                    if (managed != null)
                    {
                        room.AssignOrSyncManagedStudentSeat(managed, null);
                        await seminarCommandRepository.CommitAsync();

                        var loginName = managed.UserName.Value;
                        var roomLink = room.ClassRoomLink?.ToString() ?? "";
                        var seminarTitle = seminar.Title?.Value ?? "سمینار";
                        var firstName = (user.FirstName ?? userName).Trim();
                        var lastName = (user.LastName ?? "--").Trim();

                        await SeminarRegistrationEmailHelper.TrySendRegistrationEmailsAsync(
                            transactionalEmailNotifier,
                            string.IsNullOrEmpty(email) ? loginName : email,
                            $"{firstName} {lastName}".Trim(),
                            seminarTitle,
                            seminar.Price?.Amount ?? 0m,
                            seminar.IsFree,
                            command.HasPaid,
                            roomLink,
                            loginName,
                            "(use your website / catalog password)");
                        return await OkAsync(
                            "Registration successful. Use your existing student password to enter the online room.");
                    }

                    var alreadyInRoom = IsSeatInRoom(room, email, userName);

                    if (!alreadyInRoom && (!string.IsNullOrEmpty(email) || !string.IsNullOrEmpty(userName)))
                    {
                        var firstName = (user.FirstName ?? userName).Trim();
                        var lastName = (user.LastName ?? "--").Trim();
                        var roomLink = room.ClassRoomLink?.ToString() ?? "";
                        var seminarTitle = seminar.Title?.Value ?? "سمینار";

                        var plainPassword = GenerateStrongPassword();
                        var loginUserName = string.IsNullOrEmpty(email) ? userName : email;
                        room.AddUserRoom(firstName, lastName, loginUserName, plainPassword);

                        await seminarCommandRepository.CommitAsync();

                        await SeminarRegistrationEmailHelper.TrySendRegistrationEmailsAsync(
                            transactionalEmailNotifier,
                            string.IsNullOrEmpty(email) ? loginUserName : email,
                            $"{firstName} {lastName}".Trim(),
                            seminarTitle,
                            seminar.Price?.Amount ?? 0m,
                            seminar.IsFree,
                            command.HasPaid,
                            roomLink,
                            loginUserName,
                            plainPassword);
                        return await OkAsync("Registration successful. Room access credentials have been sent to your email.");
                    }
                }
            }

            await seminarCommandRepository.CommitAsync();
            return await OkAsync("Registration successful.");
        }

        private static string GenerateStrongPassword(int length = 14)
        {
            const string chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
            var bytes = new byte[length];
            RandomNumberGenerator.Fill(bytes);
            var result = new char[length];
            for (var i = 0; i < length; i++)
                result[i] = chars[bytes[i] % chars.Length];
            return new string(result);
        }

        private static bool IsSeatInRoom(Room room, string email, string userName)
        {
            foreach (var seat in room.RoomUsers)
            {
                if (seat.UserName != null)
                {
                    if (!string.IsNullOrEmpty(email) &&
                        string.Equals(seat.UserName.Value, email, StringComparison.OrdinalIgnoreCase))
                        return true;
                    if (!string.IsNullOrEmpty(userName) &&
                        string.Equals(seat.UserName.Value, userName, StringComparison.OrdinalIgnoreCase))
                        return true;
                }

                if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(seat.Email) &&
                    string.Equals(seat.Email.Trim(), email, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private static bool IsSeminarExpired(DateTime endTime)
        {
            var now = endTime.Kind == DateTimeKind.Utc ? DateTime.UtcNow : DateTime.Now;
            return now > endTime;
        }
    }
}
