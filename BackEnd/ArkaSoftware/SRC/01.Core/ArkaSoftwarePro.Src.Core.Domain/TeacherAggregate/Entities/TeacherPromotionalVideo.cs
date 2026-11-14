using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherPromotionalVideo : Entity
{
    public long TeacherId { get; private set; }
    public Teacher? Teacher { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string VideoUrl { get; private set; } = string.Empty;
    public string? WatermarkedVideoUrl { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
    public string? RejectionNote { get; private set; }
    public DateTime? SubmittedAtUtc { get; private set; }
    public int SortOrder { get; private set; }
    public int ViewCount { get; private set; }
    public int LikeCount { get; private set; }
    public string? ApprovedSnapshotJson { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? OgImageUrl { get; private set; }

    private TeacherPromotionalVideo() { }

    public static TeacherPromotionalVideo Create(string title, string videoUrl, string? thumbnailUrl = null, int sortOrder = 0)
    {
        return new TeacherPromotionalVideo
        {
            Title = title.Trim(),
            VideoUrl = videoUrl.Trim(),
            ThumbnailUrl = thumbnailUrl?.Trim(),
            SortOrder = sortOrder,
            ApprovalStatus = TeacherApprovalStatus.Draft,
        };
    }

    public void Update(string title, string videoUrl, string? thumbnailUrl, int sortOrder)
    {
        Title = title.Trim();
        VideoUrl = videoUrl.Trim();
        ThumbnailUrl = thumbnailUrl?.Trim();
        SortOrder = sortOrder;
        WatermarkedVideoUrl = null;
        SetApprovalStatus(TeacherApprovalStatus.Pending);
    }

    public void SetWatermarkedVideoUrl(string? watermarkedVideoUrl)
    {
        WatermarkedVideoUrl = string.IsNullOrWhiteSpace(watermarkedVideoUrl)
            ? null
            : watermarkedVideoUrl.Trim();
    }

    public string ResolvePublicPlaybackUrl()
    {
        if (ApprovalStatus == TeacherApprovalStatus.Approved
            && !string.IsNullOrWhiteSpace(WatermarkedVideoUrl))
            return WatermarkedVideoUrl;
        return VideoUrl;
    }

    public void SetApprovalStatus(TeacherApprovalStatus status, string? rejectionNote = null)
    {
        ApprovalStatus = status;
        RejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
        if (status == TeacherApprovalStatus.Pending)
            SubmittedAtUtc = DateTime.UtcNow;
    }

    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;

    public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
    {
        SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
        MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
        OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
    }

    public void IncrementView() => ViewCount++;

    public void IncrementLike() => LikeCount++;

    public void DecrementLike() => LikeCount = Math.Max(0, LikeCount - 1);
}
