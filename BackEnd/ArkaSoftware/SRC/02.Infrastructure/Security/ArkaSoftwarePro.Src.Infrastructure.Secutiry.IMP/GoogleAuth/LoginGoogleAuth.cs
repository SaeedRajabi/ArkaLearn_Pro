using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Users.GoogleAuth;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.LoginGoogleAccount;
using Google.Apis.Auth;

namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.GoogleAuth
{
    public class LoginGoogleAuth(IGoogleAuthSettingsProvider googleAuthSettingsProvider) : ILoginGoogleAuth
    {
        public async Task<object> VerifyGoogleToken(string token)
        {
            try
            {
                var options = await googleAuthSettingsProvider.GetOptionsAsync();
                if (!options.IsConfigured)
                    return null!;

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { options.ClientId }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(token, settings);

                return new GoogleUserQri
                {
                    Email = payload.Email,
                    Name = payload.Name,
                    Picture = payload.Picture,
                    ProviderId = payload.Subject
                };
            }
            catch
            {
                return null!;
            }
        }
    }
}
