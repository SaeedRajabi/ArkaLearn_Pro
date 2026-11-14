using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementTariffs;

public class GetAdvertisementTariffsQuery : IQuery<List<AdvertisementTariffQri>>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetAdvertisementTariffs";
}

public class AdvertisementTariffQri
{
    public long Id { get; set; }
    public int DurationMonths { get; set; }
    public int StarLevel { get; set; }
    public long PriceToman { get; set; }
    public int DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}
