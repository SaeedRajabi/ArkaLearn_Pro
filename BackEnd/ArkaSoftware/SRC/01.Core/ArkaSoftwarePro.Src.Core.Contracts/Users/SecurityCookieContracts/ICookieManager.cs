using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts
{
    public interface ICookieManager
    {
        Task SetAuthCookieAsync(object user , string token);

        string? GetAuthToken();


        bool IsAuthenticated();


        ClaimsPrincipal? GetAuthenticatedUser();

        Task LogoutAsync();
    }
}
