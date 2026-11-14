using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherAdvertisement;

[CacheableQuery(CacheRegion.TeacherAds)]
public class GetTeacherAdvertisementQuery : IQuery<TeacherAdvertisementQri>, IWebRequest
{
    public long? UserId { get; set; }
    public long? TeacherId { get; set; }
    public string? UserName { get; set; }
    public bool ForEdit { get; set; }
    public long? ViewerUserId { get; set; }
    public string Path => "api/Service/Teacher/GetAdvertisement";
}

public class TeacherAdvertisementQri
{
    public long Id { get; set; }
    public long TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal? PrivateTeachingCost { get; set; }
    public decimal? HourlyTeachingCost { get; set; }
    public string? WorkExperience { get; set; }
    public string DescriptionHtml { get; set; } = string.Empty;
    public string? WebsiteUrl { get; set; }
    public string? WebsiteTitle { get; set; }
    public string? ContactPhone { get; set; }
    public string? BaleLink { get; set; }
    public string? TelegramLink { get; set; }
    public string? WhatsAppLink { get; set; }
    public string? GitHubLink { get; set; }
    public string? LinkedInLink { get; set; }
    public bool InfoAccuracyConfirmed { get; set; }
    public bool TermsAccepted { get; set; }
    public bool IsPublic { get; set; }
    public string? TeacherDisplayName { get; set; }
    public string? TeacherUserName { get; set; }
    public string? TeacherAvatarUrl { get; set; }
    public List<string> Tags { get; set; } = [];
    public bool CanShowContact { get; set; }
    public bool HasContactDetails { get; set; }
    public int ListingStarLevel { get; set; }
    public string? PlanStatus { get; set; }
    public int ExperiencePoints { get; set; }
    public int XpNextThreshold { get; set; }
    public bool HasPaidFeatures { get; set; }
    public string ApprovalStatus { get; set; } = "draft";
    public string? RejectionNote { get; set; }
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
    public bool IsFollowing { get; set; }
}
