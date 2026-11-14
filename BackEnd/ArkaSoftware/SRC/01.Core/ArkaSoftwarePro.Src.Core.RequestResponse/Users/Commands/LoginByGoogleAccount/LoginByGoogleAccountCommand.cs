using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginByGoogleAccount
{
    public class LoginByGoogleAccountCommand : ICommand<object>, IWebRequest
    {
        /// <summary>Google ID token (JWT) from Google Identity Services.</summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Required only when creating a new account.
        /// 1 = Student, 2 = Teacher. Null triggers requiresAccountType for new emails.
        /// </summary>
        public int? UserRole { get; set; }

        public string Path => "/api/Service/Account/Google-Login";
    }
}
