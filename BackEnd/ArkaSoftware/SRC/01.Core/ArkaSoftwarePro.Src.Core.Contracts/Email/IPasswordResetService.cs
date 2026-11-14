namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface IPasswordResetService
{
    Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default);
}
