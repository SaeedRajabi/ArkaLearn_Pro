using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetTwoFactorEnabled;

public class SetTwoFactorEnabledCommand : ICommand<string>, IWebRequest
{
    public bool Enabled { get; set; }
    public string Path => "/api/Service/User/SetTwoFactorEnabled";
}
