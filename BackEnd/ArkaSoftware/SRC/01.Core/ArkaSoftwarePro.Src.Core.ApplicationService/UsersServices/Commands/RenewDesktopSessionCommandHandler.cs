using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RenewDesktopSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class RenewDesktopSessionCommandHandler(
        ArkaSoftwareCMPOutServices outerServices,
        IUserCommandRepository userCommandRepository,
        IJwtGeneratorSettings jwtGenerateSettings,
        IJwtGenerator jwtGenerate,
        IUserDeviceInfoService userInfoService,
        ICookieManager cookieManger)
        : CommandHandler<RenewDesktopSessionCommand, object>(outerServices)
    {
        public override async Task<CommandResult<object>> Handle(RenewDesktopSessionCommand command)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(command.AccessToken))
                    return await ResultAsync(new { message = "Access token is required." }, ApplicationServiceStatus.ValidationError);

                var principal = jwtGenerate.GetPrincipalFromExpiredToken(command.AccessToken);
                if (principal?.Identity?.IsAuthenticated != true)
                    return await ResultAsync(new { message = "Invalid access token." }, ApplicationServiceStatus.ValidationError);

                var userIdRaw =
                    principal.FindFirst("userId")?.Value ??
                    principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!long.TryParse(userIdRaw, out var userId) || userId <= 0)
                    return await ResultAsync(new { message = "Invalid access token." }, ApplicationServiceStatus.ValidationError);

                var user = await userCommandRepository.GetGraphAsync(userId);
                if (user is null)
                    return await ResultAsync(new { message = "User not found." }, ApplicationServiceStatus.NotFound);

                if (user.IsBlocked())
                    return await ResultAsync(new { message = UserAccountMessages.Blocked }, ApplicationServiceStatus.ValidationError);

                var session = user.GetCurrentSession();
                if (session is null || !session.IsValid())
                    return await ResultAsync(new { message = "Session expired." }, ApplicationServiceStatus.ValidationError);

                // Prefer matching the presented token; otherwise require at least one non-revoked auth token.
                var tokens = user.AuthenticationTokens;
                var presentedStillTrusted = tokens.Any(t =>
                    !t.IsRevoked &&
                    t.Token != null &&
                    string.Equals(t.Token.Value, command.AccessToken, StringComparison.Ordinal));
                var anyActiveToken = tokens.Any(t => t.IsValid());
                if (!presentedStillTrusted && !anyActiveToken)
                    return await ResultAsync(new { message = "Session revoked." }, ApplicationServiceStatus.ValidationError);

                var payload = await LoginSessionFinalizer.CompleteAsync(
                    user,
                    userCommandRepository,
                    jwtGenerateSettings,
                    jwtGenerate,
                    userInfoService,
                    cookieManger,
                    outerServices);

                return await ResultAsync(payload, ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(new { message = "Could not renew session." }, ApplicationServiceStatus.Exception);
            }
        }
    }
}
