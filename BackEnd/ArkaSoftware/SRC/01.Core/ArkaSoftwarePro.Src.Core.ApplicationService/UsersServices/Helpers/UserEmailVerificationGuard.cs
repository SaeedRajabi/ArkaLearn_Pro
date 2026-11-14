using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

public class UserEmailVerificationGuard(
    IUserQueryRepository userQueryRepository,
    IEmailSettingsProvider emailSettingsProvider)
{
    public async Task<(bool Ok, string Message)> EnsureVerifiedAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return (false, "User is not authenticated.");

        var runtime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        if (!runtime.RequireEmailVerification)
            return (true, string.Empty);

        var info = await userQueryRepository.GetEmailVerificationInfoAsync(userId, cancellationToken);
        if (info is null)
            return (false, "User not found.");

        if (info.Role == UserRole.ADMIN)
            return (true, string.Empty);

        if (!info.EmailVerified)
            return (false, "Email address must be verified.");

        return (true, string.Empty);
    }
}
