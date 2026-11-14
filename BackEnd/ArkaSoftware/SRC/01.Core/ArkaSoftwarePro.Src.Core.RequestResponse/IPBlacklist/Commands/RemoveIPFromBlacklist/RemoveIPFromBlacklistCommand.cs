using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Commands.RemoveIPFromBlacklist;

public class RemoveIPFromBlacklistCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/Security/IPBlacklist/Remove";
}
