using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts
{
    public interface IAuthenticatableUser
    {
        long Id { get; }
        string UserName { get; }
        string Email { get; }
        string? FirstName { get; }
        string? LastName { get; }
        Guid BusinessId { get; }
        string Role { get; }

        void AddClaims(List<Claim> claims);

        bool ClaimExist();
    }
}
