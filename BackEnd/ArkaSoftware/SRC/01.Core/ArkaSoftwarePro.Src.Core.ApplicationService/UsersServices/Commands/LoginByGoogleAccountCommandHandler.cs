using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.GoogleAuth;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginByGoogleAccount;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.LoginGoogleAccount;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Generator;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class LoginByGoogleAccountCommandHandler(
        ArkaSoftwareCMPOutServices outerServices,
        IUserUnitOfWork userUnitOfWork,
        IJwtGeneratorSettings jwtGenerateSettings,
        IJwtGenerator jwtGenerate,
        IUserDeviceInfoService userInfoService,
        ICookieManager cookieManger,
        ILoginGoogleAuth loginGoogleAuth,
        IUserWalletRepository userWalletRepository,
        ITransactionalEmailNotifier transactionalEmailNotifier,
        IdGenerator idGenerator)
        : CommandHandler<LoginByGoogleAccountCommand, object>(outerServices)
    {
        public override async Task<CommandResult<object>> Handle(LoginByGoogleAccountCommand command)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(command.Token))
                    return await ResultAsync(new { message = "Google Token Is Not Valid." }, ApplicationServiceStatus.ValidationError);

                var googleUser = await loginGoogleAuth.VerifyGoogleToken(command.Token);
                if (googleUser is not GoogleUserQri googleUserMap ||
                    string.IsNullOrWhiteSpace(googleUserMap.Email))
                {
                    return await ResultAsync(new { message = "Google Token Is Not Valid." }, ApplicationServiceStatus.ValidationError);
                }

                var email = googleUserMap.Email.Trim().ToLowerInvariant();
                var existing = userUnitOfWork.UserCommandRepository.FindByUserNameAsync(email);

                if (existing is null)
                {
                    if (command.UserRole is not (int)UserRole.STUDENT and not (int)UserRole.TEACHER)
                    {
                        return await ResultAsync(new
                        {
                            requiresAccountType = true,
                            email,
                            name = googleUserMap.Name ?? string.Empty,
                        }, ApplicationServiceStatus.Ok);
                    }

                    var role = (UserRole)command.UserRole.Value;
                    var displayName = string.IsNullOrWhiteSpace(googleUserMap.Name)
                        ? email.Split('@')[0]
                        : googleUserMap.Name.Trim();
                    var userName = await BuildUniqueUserNameAsync(email, displayName);
                    var randomPassword = $"Ggl_{googleUserMap.ProviderId}_{Guid.NewGuid():N}";

                    var user = new User(
                        new PId(idGenerator.Next()),
                        new UserName(userName),
                        randomPassword,
                        new Email(email),
                        role,
                        acceptedTerms: true);

                    var (firstName, lastName) = DisplayNameSplitter.Split(displayName);
                    user.UpdateUserFullName(firstName, lastName);
                    user.MarkEmailVerified();

                    outerServices.CurrentUserContext.SetUserId(user.Id.ToString());

                    if (role == UserRole.STUDENT)
                    {
                        await userUnitOfWork.StudentCommandRepository.InsertAsync(new Student(user.Id));
                    }
                    else
                    {
                        await userUnitOfWork.TeacherCommandRepository.InsertAsync(
                            Teacher.Create(user.Id, string.Empty));
                        await userUnitOfWork.StudentCommandRepository.InsertAsync(new Student(user.Id));
                    }

                    await userUnitOfWork.UserCommandRepository.InsertAsync(user);
                    await userUnitOfWork.CommitAsync();

                    try
                    {
                        await userWalletRepository.GetOrCreateByUserIdAsync(user.Id);
                    }
                    catch
                    {
                        /* wallet is best-effort */
                    }

                    try
                    {
                        await transactionalEmailNotifier.SendWelcomeAsync(
                            email,
                            displayName,
                            role == UserRole.TEACHER);
                    }
                    catch
                    {
                        /* welcome email is best-effort */
                    }

                    var payload = await LoginSessionFinalizer.CompleteAsync(
                        user,
                        userUnitOfWork.UserCommandRepository,
                        jwtGenerateSettings,
                        jwtGenerate,
                        userInfoService,
                        cookieManger,
                        outerServices);

                    return await ResultAsync(
                        WrapLoginPayload(payload, isNewUser: true, requiresPhoneVerification: !user.PhoneNumberVerified),
                        ApplicationServiceStatus.Ok);
                }

                if (existing.IsBlocked())
                    return await ResultAsync(new { message = UserAccountMessages.Blocked }, ApplicationServiceStatus.ValidationError);

                // Existing Google users get email marked verified if not already.
                if (!existing.EmailVerified)
                {
                    existing.MarkEmailVerified();
                    await userUnitOfWork.CommitAsync();
                }

                var loginPayload = await LoginSessionFinalizer.CompleteAsync(
                    existing,
                    userUnitOfWork.UserCommandRepository,
                    jwtGenerateSettings,
                    jwtGenerate,
                    userInfoService,
                    cookieManger,
                    outerServices);

                return await ResultAsync(
                    WrapLoginPayload(loginPayload, isNewUser: false, requiresPhoneVerification: !existing.PhoneNumberVerified),
                    ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }

        private static object WrapLoginPayload(object payload, bool isNewUser, bool requiresPhoneVerification)
        {
            var userDataProp = payload.GetType().GetProperty("userData");
            var userData = userDataProp?.GetValue(payload) ?? payload;
            return new
            {
                isNewUser,
                requiresPhoneVerification,
                userData,
            };
        }

        private async Task<string> BuildUniqueUserNameAsync(string email, string displayName)
        {
            var local = email.Split('@')[0];
            var raw = string.IsNullOrWhiteSpace(local) ? displayName : local;
            var sanitized = new string(raw
                .Trim()
                .Select(c => char.IsLetterOrDigit(c) || c == '_' || c == '.' ? c : '_')
                .ToArray());
            if (sanitized.Length < 3)
                sanitized = $"user_{idGenerator.Next()}";
            if (sanitized.Length > 40)
                sanitized = sanitized[..40];

            var candidate = sanitized;
            var suffix = 0;
            while (true)
            {
                var conflict = userUnitOfWork.UserCommandRepository.FindByUserNameAsync(candidate);
                if (conflict is null)
                    return candidate;
                suffix++;
                candidate = $"{sanitized}_{suffix}";
                if (suffix > 50)
                {
                    candidate = $"g_{idGenerator.Next()}";
                    break;
                }
            }

            await Task.CompletedTask;
            return candidate;
        }
    }
}
