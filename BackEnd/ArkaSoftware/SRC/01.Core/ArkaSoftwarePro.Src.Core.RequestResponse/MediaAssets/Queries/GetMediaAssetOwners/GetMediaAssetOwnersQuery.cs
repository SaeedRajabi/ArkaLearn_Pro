using Framework.Src.Core.RequestResponse.Queries;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssetOwners;



public class GetMediaAssetOwnersQuery : IQuery<PagedMediaAssetOwnersQri>

{

    public long RequestingUserId { get; set; }

    public bool IsAdmin { get; set; }

    public string? Search { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;

}



public class PagedMediaAssetOwnersQri

{

    public List<MediaAssetOwnerQri> Items { get; set; } = [];

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }

}



public class MediaAssetOwnerQri

{

    public long OwnerUserId { get; set; }

    public string OwnerName { get; set; } = string.Empty;

    public int MediaCount { get; set; }

    public string? LastUploadedAtUtc { get; set; }

}

