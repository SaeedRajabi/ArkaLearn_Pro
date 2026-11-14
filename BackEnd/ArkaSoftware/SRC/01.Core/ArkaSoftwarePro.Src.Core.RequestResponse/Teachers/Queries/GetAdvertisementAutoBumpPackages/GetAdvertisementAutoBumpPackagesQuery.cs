using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementAutoBumpPackages;

public class GetAdvertisementAutoBumpPackagesQuery : IQuery<List<AdvertisementAutoBumpPackageQri>>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetAdvertisementAutoBumpPackages";
}

public class AdvertisementAutoBumpPackageQri
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public long PriceToman { get; set; }
    public bool IsActive { get; set; }
}
