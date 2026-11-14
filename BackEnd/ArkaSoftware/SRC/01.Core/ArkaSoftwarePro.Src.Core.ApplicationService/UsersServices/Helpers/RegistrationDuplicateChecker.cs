using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

public static class RegistrationDuplicateChecker
{
    public static async Task<string?> FindConflictAsync(
        IUserCommandRepository repository,
        string email,
        string userName,
        string localPhone,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedUserName = userName.Trim();

        if (await repository.ExistsAsync(x => x.Email == new Email(normalizedEmail)))
            return "email";

        if (await repository.ExistsAsync(x => x.UserName == new UserName(normalizedUserName)))
            return "username";

        if (await repository.ExistsAsync(x => x.PhoneNumber != null && x.PhoneNumber.Number == localPhone))
            return "phone";

        return null;
    }

    public static string ToUserMessage(string conflict) =>
        conflict switch
        {
            "email" => "An account with this email already exists.",
            "username" => "An account with this username already exists.",
            "phone" => "An account with this phone number already exists.",
            _ => "An account with these details already exists."
        };
}
