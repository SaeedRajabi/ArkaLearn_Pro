using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices;

internal static class SoftwareMapper
{
    public static string MapStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };

    public static SoftwarePublicQri ToPublicQri(SoftwareProduct item, bool isLiked = false, IReadOnlyList<string>? categoryPath = null)
    {
        var user = item.Teacher?.User;
        var displayName = user != null
            ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
            : string.Empty;

        return new SoftwarePublicQri
        {
            Id = item.Id,
            TeacherId = item.TeacherId,
            Title = item.Title,
            ShortDescription = item.Description,
            LongDescriptionHtml = item.LongDescriptionHtml,
            CoverImageUrl = item.CoverImageUrl,
            InstallerFileUrl = item.InstallerFileUrl,
            InstallerFileName = item.InstallerFileName,
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Title?.Value,
            CategoryPath = categoryPath?.ToList() ?? [],
            Slug = item.Slug,
            Tags = item.GetTags().ToList(),
            DownloadCount = item.DownloadCount,
            LikeCount = item.LikeCount,
            IsLikedByViewer = isLiked,
            IsPlatformOwned = item.IsPlatformOwned,
            ApprovalStatus = MapStatus(item.ApprovalStatus),
            TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
            TeacherUserName = user?.UserName?.Value,
            TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
            SeoTitle = item.SeoTitle,
            MetaDescription = item.MetaDescription,
            OgImageUrl = item.OgImageUrl,
        };
    }

    public static bool IsPubliclyVisible(SoftwareProduct item) =>
        !item.IsDelete
        && item.ApprovalStatus == TeacherApprovalStatus.Approved
        && (item.IsPlatformOwned
            || (item.Teacher != null && item.Teacher.AccountStatus == TeacherAccountStatus.Active));
}
