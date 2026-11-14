using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;

public class MediaAsset : AggregateRoot
{
    public long OwnerUserId { get; private set; }
    public string FileUrl { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public string MimeType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public MediaType MediaType { get; private set; }
    public string? Title { get; private set; }
    public string? AltText { get; private set; }
    public string? Caption { get; private set; }
    public string? Description { get; private set; }
    public int? Width { get; private set; }
    public int? Height { get; private set; }
    public MediaApprovalStatus ApprovalStatus { get; private set; } = MediaApprovalStatus.Approved;
    public string? RejectionReason { get; private set; }
    public bool IsRejectionDismissed { get; private set; }

    // ---- DRM / encrypted playback (Desktop secure player) ----
    public bool IsEncrypted { get; private set; }
    public string? EncryptedFileUrl { get; private set; }
    public string EncryptionAlgorithm { get; private set; } = "AES-256-CBC";
    public string? ContentKeyId { get; private set; }
    public string? EncryptionIvBase64 { get; private set; }
    public string? ContentChecksumSha256 { get; private set; }
    public EncryptedMediaStatus EncryptionStatus { get; private set; }
    public DateTime? EncryptedAtUtc { get; private set; }

    private MediaAsset() { }

    public static MediaAsset Create(
        long ownerUserId,
        string fileUrl,
        string originalFileName,
        string mimeType,
        long fileSizeBytes,
        MediaType mediaType,
        string? title = null,
        string? altText = null,
        string? caption = null,
        string? description = null,
        int? width = null,
        int? height = null)
    {
        if (ownerUserId <= 0)
            throw new ArgumentException("Owner user id is required.", nameof(ownerUserId));
        if (string.IsNullOrWhiteSpace(fileUrl))
            throw new ArgumentException("File URL is required.", nameof(fileUrl));

        return new MediaAsset
        {
            OwnerUserId = ownerUserId,
            FileUrl = fileUrl.Trim(),
            OriginalFileName = string.IsNullOrWhiteSpace(originalFileName) ? "file" : originalFileName.Trim(),
            MimeType = string.IsNullOrWhiteSpace(mimeType) ? "application/octet-stream" : mimeType.Trim(),
            FileSizeBytes = fileSizeBytes >= 0 ? fileSizeBytes : 0,
            MediaType = mediaType,
            Title = NormalizeOptional(title, 200),
            AltText = NormalizeOptional(altText, 500),
            Caption = NormalizeOptional(caption, 1000),
            Description = NormalizeOptional(description, 2000),
            Width = width,
            Height = height,
            ApprovalStatus = MediaApprovalStatus.Approved,
            IsRejectionDismissed = false,
            IsEncrypted = false,
            EncryptionStatus = EncryptedMediaStatus.None,
            EncryptionAlgorithm = "AES-256-CBC",
        };
    }

    public void UpdateMetadata(
        string? title,
        string? altText,
        string? caption,
        string? description)
    {
        Title = NormalizeOptional(title, 200);
        AltText = NormalizeOptional(altText, 500);
        Caption = NormalizeOptional(caption, 1000);
        Description = NormalizeOptional(description, 2000);
    }

    public void MarkEncryptionPending(string contentKeyId)
    {
        if (string.IsNullOrWhiteSpace(contentKeyId))
            throw new ArgumentException("Content key id is required.", nameof(contentKeyId));

        ContentKeyId = contentKeyId.Trim();
        EncryptionStatus = EncryptedMediaStatus.Pending;
        IsEncrypted = false;
    }

    public void CompleteEncryption(
        string encryptedFileUrl,
        string contentKeyId,
        string ivBase64,
        string checksumSha256,
        string algorithm = "AES-256-CBC")
    {
        if (string.IsNullOrWhiteSpace(encryptedFileUrl))
            throw new ArgumentException("Encrypted file URL is required.", nameof(encryptedFileUrl));
        if (string.IsNullOrWhiteSpace(contentKeyId))
            throw new ArgumentException("Content key id is required.", nameof(contentKeyId));
        if (string.IsNullOrWhiteSpace(ivBase64))
            throw new ArgumentException("IV is required.", nameof(ivBase64));

        EncryptedFileUrl = encryptedFileUrl.Trim();
        ContentKeyId = contentKeyId.Trim();
        EncryptionIvBase64 = ivBase64.Trim();
        ContentChecksumSha256 = NormalizeOptional(checksumSha256, 128);
        EncryptionAlgorithm = string.IsNullOrWhiteSpace(algorithm) ? "AES-256-CBC" : algorithm.Trim();
        IsEncrypted = true;
        EncryptionStatus = EncryptedMediaStatus.Ready;
        EncryptedAtUtc = DateTime.UtcNow;
    }

    public void MarkEncryptionFailed()
    {
        EncryptionStatus = EncryptedMediaStatus.Failed;
        IsEncrypted = false;
    }

    public void SoftDelete()
    {
        if (IsDelete)
            return;

        IsDelete = true;
    }

    public void Reject(string reason)
    {
        ApprovalStatus = MediaApprovalStatus.Rejected;
        RejectionReason = NormalizeOptional(reason, 1000);
        IsRejectionDismissed = false;
    }

    public void DismissRejectionNotice()
    {
        IsRejectionDismissed = true;
    }

    public void Approve()
    {
        ApprovalStatus = MediaApprovalStatus.Approved;
        RejectionReason = null;
        IsRejectionDismissed = false;
    }

    private static string? NormalizeOptional(string? value, int maxLength) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, maxLength)];
}
