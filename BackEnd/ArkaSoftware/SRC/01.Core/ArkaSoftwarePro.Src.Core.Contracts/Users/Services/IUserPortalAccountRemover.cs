namespace ArkaSoftwarePro.Src.Core.Contracts.Users.Services;

/// <summary>
/// Removes a portal user and related student data from the database.
/// </summary>
public interface IUserPortalAccountRemover
{
    Task RemoveUserByIdAsync(long userId, CancellationToken cancellationToken = default);
}
