using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;

public class SoftwareProduct : AggregateRoot
{
    public long? TeacherId { get; private set; }
    public Teacher? Teacher { get; private set; }
    public long AuthorUserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string LongDescriptionHtml { get; private set; } = string.Empty;
    public string? CoverImageUrl { get; private set; }
    public string? InstallerFileUrl { get; private set; }
    public string? InstallerFileName { get; private set; }
    public long? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public string TagsJson { get; private set; } = "[]";
    public int DownloadCount { get; private set; }
    public int LikeCount { get; private set; }
    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
    public string? ApprovedSnapshotJson { get; private set; }
    public int SortOrder { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? OgImageUrl { get; private set; }

    private SoftwareProduct() { }

    public static SoftwareProduct CreatePlatform(
        long authorUserId,
        string title,
        string shortDescription,
        string longDescriptionHtml,
        string? coverImageUrl,
        string? installerFileUrl,
        string? installerFileName,
        long? categoryId,
        IReadOnlyList<string> tags,
        int sortOrder = 0)
    {
        var item = new SoftwareProduct
        {
            AuthorUserId = authorUserId,
            Title = title.Trim(),
            Description = shortDescription.Trim(),
            LongDescriptionHtml = longDescriptionHtml?.Trim() ?? string.Empty,
            CoverImageUrl = coverImageUrl?.Trim(),
            InstallerFileUrl = string.IsNullOrWhiteSpace(installerFileUrl) ? null : installerFileUrl.Trim(),
            InstallerFileName = string.IsNullOrWhiteSpace(installerFileName) ? null : installerFileName.Trim(),
            CategoryId = categoryId is > 0 ? categoryId : null,
            TagsJson = TeacherBook.SerializeTags(tags),
            SortOrder = sortOrder,
            ApprovalStatus = TeacherApprovalStatus.Approved,
        };
        item.Slug = SlugHelper.Generate(item.Title);
        return item;
    }

    public static SoftwareProduct CreateTeacher(
        long teacherId,
        long authorUserId,
        string title,
        string shortDescription,
        string longDescriptionHtml,
        string? coverImageUrl,
        string? installerFileUrl,
        string? installerFileName,
        long? categoryId,
        IReadOnlyList<string> tags,
        int sortOrder,
        TeacherApprovalStatus approvalStatus)
    {
        var item = new SoftwareProduct
        {
            TeacherId = teacherId,
            AuthorUserId = authorUserId,
            Title = title.Trim(),
            Description = shortDescription.Trim(),
            LongDescriptionHtml = longDescriptionHtml?.Trim() ?? string.Empty,
            CoverImageUrl = coverImageUrl?.Trim(),
            InstallerFileUrl = string.IsNullOrWhiteSpace(installerFileUrl) ? null : installerFileUrl.Trim(),
            InstallerFileName = string.IsNullOrWhiteSpace(installerFileName) ? null : installerFileName.Trim(),
            CategoryId = categoryId is > 0 ? categoryId : null,
            TagsJson = TeacherBook.SerializeTags(tags),
            SortOrder = sortOrder,
            ApprovalStatus = approvalStatus,
        };
        item.Slug = SlugHelper.Generate(item.Title);
        return item;
    }

    public void Update(
        string title,
        string shortDescription,
        string longDescriptionHtml,
        string? coverImageUrl,
        string? installerFileUrl,
        string? installerFileName,
        long? categoryId,
        IReadOnlyList<string> tags,
        int sortOrder,
        TeacherApprovalStatus? approvalStatus = null)
    {
        Title = title.Trim();
        Description = shortDescription.Trim();
        LongDescriptionHtml = longDescriptionHtml?.Trim() ?? string.Empty;
        CoverImageUrl = coverImageUrl?.Trim();
        if (installerFileUrl != null)
        {
            InstallerFileUrl = string.IsNullOrWhiteSpace(installerFileUrl) ? null : installerFileUrl.Trim();
            InstallerFileName = string.IsNullOrWhiteSpace(installerFileName) ? null : installerFileName.Trim();
        }
        CategoryId = categoryId is > 0 ? categoryId : null;
        TagsJson = TeacherBook.SerializeTags(tags);
        SortOrder = sortOrder;
        if (approvalStatus.HasValue)
            ApprovalStatus = approvalStatus.Value;
        if (string.IsNullOrWhiteSpace(Slug))
            Slug = SlugHelper.Generate(Title, Id > 0 ? Id : null);
    }

    public void EnsureSlug(long id)
    {
        if (string.IsNullOrWhiteSpace(Slug) || !Slug.EndsWith($"-{id}", StringComparison.Ordinal))
            Slug = SlugHelper.Generate(Title, id);
    }

    public void SetApprovalStatus(TeacherApprovalStatus status) => ApprovalStatus = status;
    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;
    public void IncrementDownload() => DownloadCount++;
    public void IncrementLike() => LikeCount++;
    public void DecrementLike() => LikeCount = Math.Max(0, LikeCount - 1);

    public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
    {
        SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
        MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
        OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
    }

    public IReadOnlyList<string> GetTags() => TeacherBook.ParseTags(TagsJson);
    public bool IsPlatformOwned => !TeacherId.HasValue || TeacherId.Value <= 0;
}
