using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherAdvertisement;

[InvalidatesCache(CacheRegion.TeacherAds, CacheRegion.Teachers)]
public class SaveTeacherAdvertisementCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
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
    public List<string> Tags { get; set; } = [];
    public string Path => "api/Service/Teacher/SaveAdvertisement";
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
