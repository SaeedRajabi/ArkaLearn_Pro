namespace ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Queries.GetMediaAssets;



public class MediaAssetQri

{

    public long Id { get; set; }

    public long OwnerUserId { get; set; }

    public string? OwnerName { get; set; }

    public string FileUrl { get; set; } = string.Empty;

    public string OriginalFileName { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public int MediaType { get; set; }

    public string? Title { get; set; }

    public string? AltText { get; set; }

    public string? Caption { get; set; }

    public string? Description { get; set; }

    public int? Width { get; set; }

    public int? Height { get; set; }

    public int ApprovalStatus { get; set; }

    public string? RejectionReason { get; set; }

    public bool IsRejectionDismissed { get; set; }

    public string CreatedAtUtc { get; set; } = string.Empty;

    public string UpdatedAtUtc { get; set; } = string.Empty;

}

