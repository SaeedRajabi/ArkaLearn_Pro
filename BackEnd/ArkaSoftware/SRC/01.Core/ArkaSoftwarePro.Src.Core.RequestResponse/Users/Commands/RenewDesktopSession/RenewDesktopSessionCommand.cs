using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RenewDesktopSession
{
    /// <summary>
    /// Renews a desktop access JWT while the backend UserSession is still valid
    /// (even if the previous JWT lifetime has expired).
    /// </summary>
    public class RenewDesktopSessionCommand : ICommand<object>, IWebRequest
    {
        public string AccessToken { get; set; } = string.Empty;

        public string Path => "/api/Service/Account/RenewDesktopSession";
    }
}
