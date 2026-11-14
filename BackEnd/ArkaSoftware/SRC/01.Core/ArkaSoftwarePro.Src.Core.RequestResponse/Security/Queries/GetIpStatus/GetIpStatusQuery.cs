using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Security.Queries.GetIpStatus;

public class GetIpStatusQuery : IQuery<IpStatusQri>, IWebRequest
{
    public string Path => "/api/Service/Security/IpStatus";
}

public class IpStatusQri
{
    public bool IsBlocked { get; set; }
}
