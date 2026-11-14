using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Queries.GetAboutUs
{
    public class GetAboutUsQuery : IQuery<AboutUsQri>, IWebRequest
    {
        public string Path => "api/Service/AboutUs/Get";
    }
}
