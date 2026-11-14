using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Adapters
{
    public class AuthUserAdapter(User user):IAuthenticatableUser
    {
        public long Id => user.Id;
        public string UserName => user.UserName!.Value;
        public string Email => user.Email.Value;
        public string? FirstName => user.UserFullName?.FirstName;
        public string? LastName => user.UserFullName?.LastName;
        public Guid BusinessId => user.BusinessId.Value;
        public string Role => user.Role.ToString();

        public void AddClaims(List<Claim> claims)
        {
            foreach (var claim in claims)
            {
                user.AddClaim(claim.Type , claim.Value);
            }
        }

        public bool ClaimExist()
        {
            return user.UserClaims.Any();
        }
    }
}
