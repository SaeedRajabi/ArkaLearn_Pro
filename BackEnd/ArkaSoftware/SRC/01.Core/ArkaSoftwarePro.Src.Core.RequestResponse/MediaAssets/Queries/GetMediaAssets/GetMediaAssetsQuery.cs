using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssets;

public class GetMediaAssetsQuery : IQuery<PagedMediaAssetsQri>
{
    public long RequestingUserId { get; set; }
    public bool IsAdmin { get; set; }
    public long? OwnerUserId { get; set; }
    public int? MediaType { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

public class PagedMediaAssetsQri
{
    public List<MediaAssetQri> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
