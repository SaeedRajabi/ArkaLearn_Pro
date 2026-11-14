using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AddUsers;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.DateTimes;
using Framework.Src.Utilities.OutService.Generator;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class CreateUserCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IJwtGeneratorSettings jwtGeneratorSettings,
        IJwtGenerator jwtGenerator,
        IUserUnitOfWork userUnitOfWork,
        ICookieManager cookieManager,
        IManagedRoomStudentCommandRepository managedRoomStudentRepository,
        IUserDeviceInfoService userDeviceInfoService,
        INotificationSettingsProvider notificationSettingsProvider,
        IPhoneVerificationService phoneVerificationService,
        IUserWalletRepository userWalletRepository,
        ITransactionalEmailNotifier transactionalEmailNotifier,
        INewsletterSubscriptionService newsletterSubscriptionService,
        IdGenerator idGenerator)
        : CommandHandler<AddUser, object>(mafiaOuterServices)
    {
        public override async Task<CommandResult<object>> Handle(AddUser command)
        {
            if (!command.AcceptedTerms)
                return await ResultAsync(new { message = "Accept Terms Is Required Checked." }, ApplicationServiceStatus.ValidationError);

            if (command.UserRole != UserRole.STUDENT && command.UserRole != UserRole.TEACHER)
            {
                AddMessage("Invalid registration role.");
                return await ResultAsync(new { message = "Invalid registration role." }, ApplicationServiceStatus.ValidationError);
            }

            if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out var localPhone))
            {
                AddMessage("Phone number must be a valid Iranian mobile number (e.g. 09182767745).");
                return await ResultAsync(new { message = "Invalid phone number." }, ApplicationServiceStatus.ValidationError);
            }

            var smsSettings = await notificationSettingsProvider.GetCurrentAsync();
            var registrationOtpRequired = smsSettings is { RegistrationOtpEnabled: true, CanSendSms: true };
            if (registrationOtpRequired)
            {
                if (string.IsNullOrWhiteSpace(command.OtpSessionId) || string.IsNullOrWhiteSpace(command.OtpCode))
                {
                    AddMessage("Phone verification code is required.");
                    return await ResultAsync(new { message = "Phone verification code is required." }, ApplicationServiceStatus.ValidationError);
                }

                var verified = await phoneVerificationService.IsRegistrationVerifiedAsync(
                    command.OtpSessionId,
                    command.PhoneNumber,
                    CancellationToken.None);
                if (!verified)
                {
                    var otpOk = await phoneVerificationService.VerifyRegistrationOtpAsync(
                        command.OtpSessionId,
                        command.PhoneNumber,
                        command.OtpCode,
                        CancellationToken.None);
                    if (!otpOk)
                    {
                        AddMessage("Invalid or expired verification code.");
                        return await ResultAsync(new { message = "Invalid or expired verification code." }, ApplicationServiceStatus.ValidationError);
                    }
                }
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
                return await ResultAsync(new { message }, ApplicationServiceStatus.Exist);
            }

            User user = new(
                new PId(idGenerator.Next()),
                new UserName(userName),
                command.Password,
                new Email(email),
                command.UserRole,
                command.AcceptedTerms);

            var (firstName, lastName) = DisplayNameSplitter.Split(command.FullName);
            user.UpdateUserFullName(firstName, lastName);
            user.SetPhoneNumber(IranianPhoneNormalizer.CountryCode, localPhone);
            if (registrationOtpRequired)
                user.VerifyPhoneNumber();

            _mafiaOuterService.CurrentUserContext.SetUserId(user.Id.ToString());
            if (command.UserRole == UserRole.STUDENT)
            {
                await userUnitOfWork.StudentCommandRepository.InsertAsync(new Student(user.Id));

                var emailValue = user.Email.Value;
                var managedExists = await managedRoomStudentRepository.ExistsAsync(x =>
                    x.UserName == user.UserName ||
                    (!string.IsNullOrWhiteSpace(x.Email) &&
                     !string.IsNullOrWhiteSpace(emailValue) &&
                     x.Email!.Equals(emailValue)));

                if (!managedExists)
                {
                    var phoneDisplay = $"0{localPhone}";
                    var managed = ManagedRoomStudent.Create(
                        firstName,
                        lastName,
                        userName,
                        emailValue,
                        command.Password,
                        phone: phoneDisplay,
                        notes: "Registered from client website",
                        gender: null,
                        dateOfBirth: null,
                        photoUrl: null);
                    await managedRoomStudentRepository.InsertAsync(managed);
                }
            }
            else
            {
                await userUnitOfWork.TeacherCommandRepository.InsertAsync(
                    Teacher.Create(user.Id, string.Empty));
                await userUnitOfWork.StudentCommandRepository.InsertAsync(new Student(user.Id));
            }

            var expiresAt = DateTime.UtcNow.AddDays(jwtGeneratorSettings.RefreshTokenLifetimeDays);
            var userSession = user.AddSession(expiresAt, userDeviceInfoService.GetUserInfo().IpAddress, userDeviceInfoService.GetUserInfo().UserAgent);
            var accessToken = jwtGenerator.GenerateJwtToken(user);
            var refreshToken = jwtGenerator.GenerateRefreshToken();

            AuthenticationToken authenticationToken = new(user.Id, accessToken, expiresAt, DateTime.Now, false);
            user.AddAuthenticationToken(authenticationToken);

            user.CreateUserActionLog(
                ActionType.REGESTER,
                DateTimeKind.Local.GetNow().ToIranTimeZoneDateTime(),
                userDeviceInfoService.GetUserInfo().IpAddress,
                userDeviceInfoService.GetUserInfo().UserAgent);

            await userUnitOfWork.UserCommandRepository.InsertAsync(user);
            await userUnitOfWork.CommitAsync();

            await userWalletRepository.GetOrCreateByUserIdAsync(user.Id);

            await cookieManager.SetAuthCookieAsync(user, accessToken);

            var displayName = user.UserFullName! != null!
                ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                : user.UserName.Value;

            try
            {
                if (!string.IsNullOrWhiteSpace(user.Email.Value))
                {
                    await transactionalEmailNotifier.SendWelcomeAsync(
                        user.Email.Value,
                        displayName,
                        command.UserRole == UserRole.TEACHER);
                }
            }
            catch
            {
                // Registration should succeed even if welcome email fails.
            }

            if (command.UserRole == UserRole.STUDENT && !string.IsNullOrWhiteSpace(user.Email.Value))
            {
                try
                {
                    await newsletterSubscriptionService.EnsureVerifiedSubscriberAsync(
                        user.Email.Value,
                        user.Id,
                        CancellationToken.None);
                }
                catch
                {
                    // Registration should succeed even if newsletter subscribe fails.
                }
            }

            return await OkAsync(new
            {
                userData = new
                {
                    Token = accessToken,
                    Id = user.Id.ToString(),
                    Name = displayName,
                    FullName = displayName,
                    UserName = user.UserName.Value,
                    Email = user.Email.Value,
                    TeacherId = (long?)null,
                    AvatarUrl = user.UserName.Value.Length >= 2
                        ? user.UserName.Value[..2]
                        : user.UserName.Value,
                    Role = user.Role switch
                    {
                        UserRole.STUDENT => "student",
                        UserRole.TEACHER => "teacher",
                        UserRole.ADMIN => "admin",
                        _ => "user"
                    },
                    Status = user.Status.ToString(),
                    LastLogin = user.LastLoginDateTime
                }
            });
        }
    }
}
