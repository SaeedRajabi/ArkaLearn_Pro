using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Queries.SearchIPBlacklists;

public class SearchIPBlacklistsQuery : PageQuery<PagedData<IPBlacklistListItemQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public string Path => "/api/Service/Security/IPBlacklist/Search";
}

public class IPBlacklistListItemQri
{
    public long Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceInformation { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime AddedDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsPermanent { get; set; }
}
