using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts
{
    public interface IJwtGenerator
    {
        string GenerateJwtToken(object userEntity);
        ClaimsPrincipal ValidateToken(string token);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);

    }

}
