using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.HasAdvertisementContactUnlock;

public class HasAdvertisementContactUnlockQuery : IQuery<ContactUnlockStatusQri>, IWebRequest
{
    public long TeacherId { get; set; }
    public string Path => "/api/Service/Teacher/HasAdvertisementContactUnlock";
}

public class ContactUnlockStatusQri
{
    public bool IsUnlocked { get; set; }
    public bool ContactVisibleWithoutPayment { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public long UnlockPriceToman { get; set; }
}
