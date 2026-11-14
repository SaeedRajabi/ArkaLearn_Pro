namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.MediaAssets;



public class MediaAssetQueryModel

{

    public long Id { get; set; }

    public long OwnerUserId { get; set; }

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

    public DateTime? CreatedDateTime { get; set; }

    public DateTime? ModifiedDateTime { get; set; }

    public bool IsDelete { get; set; }

    public bool IsEncrypted { get; set; }
    public string? EncryptedFileUrl { get; set; }
    public string? EncryptionAlgorithm { get; set; }
    public string? ContentKeyId { get; set; }
    public string? EncryptionIvBase64 { get; set; }
    public string? ContentChecksumSha256 { get; set; }
    public int EncryptionStatus { get; set; }
}

