using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetMySoftware;

public class GetMySoftwareQuery : IQuery<List<SoftwarePublicQri>>, IWebRequest
{
    public string Path => "/api/Service/Software/GetMySoftware";
}
