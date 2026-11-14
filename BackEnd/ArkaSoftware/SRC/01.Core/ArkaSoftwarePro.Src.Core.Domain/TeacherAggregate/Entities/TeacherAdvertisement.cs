using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherAdvertisement : Entity
{
    public long TeacherId { get; private set; }
    public Teacher? Teacher { get; private set; }

    public string Title { get; private set; } = string.Empty;
    public decimal? PrivateTeachingCost { get; private set; }
    public decimal? HourlyTeachingCost { get; private set; }
    public string? WorkExperience { get; private set; }
    public string DescriptionHtml { get; private set; } = string.Empty;
    public string TagsJson { get; private set; } = "[]";
    public string? WebsiteUrl { get; private set; }
    public string? WebsiteTitle { get; private set; }
    public string? ContactPhone { get; private set; }
    public string? BaleLink { get; private set; }
    public string? TelegramLink { get; private set; }
    public string? WhatsAppLink { get; private set; }
    public string? GitHubLink { get; private set; }
    public string? LinkedInLink { get; private set; }
    public bool InfoAccuracyConfirmed { get; private set; }
    public bool TermsAccepted { get; private set; }
    public bool IsPublic { get; private set; }
    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
    public string? RejectionNote { get; private set; }
    public DateTime? SubmittedAtUtc { get; private set; }
    public DateTime? LastBumpedAtUtc { get; private set; }
    public DateTime? LastManualBumpAtUtc { get; private set; }
    public int ListingStarLevel { get; private set; }
    public string? ApprovedSnapshotJson { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? OgImageUrl { get; private set; }

    private TeacherAdvertisement() { }

    public static TeacherAdvertisement Create(
        string title,
        decimal? privateTeachingCost,
        decimal? hourlyTeachingCost,
        string? workExperience,
        string descriptionHtml,
        string? websiteUrl,
        string? websiteTitle,
        string? contactPhone,
        string? baleLink,
        string? telegramLink,
        string? whatsAppLink,
        string? gitHubLink,
        string? linkedInLink,
        IReadOnlyList<string> tags,
        bool infoAccuracyConfirmed,
        bool termsAccepted,
        bool isPublic)
    {
        return new TeacherAdvertisement
        {
            Title = title.Trim(),
            PrivateTeachingCost = privateTeachingCost,
            HourlyTeachingCost = hourlyTeachingCost,
            WorkExperience = workExperience?.Trim(),
            DescriptionHtml = descriptionHtml ?? string.Empty,
            TagsJson = SerializeTags(tags),
            WebsiteUrl = NormalizeUrl(websiteUrl),
            WebsiteTitle = websiteTitle?.Trim(),
            ContactPhone = contactPhone?.Trim(),
            BaleLink = NormalizeUrl(baleLink),
            TelegramLink = NormalizeUrl(telegramLink),
            WhatsAppLink = NormalizeUrl(whatsAppLink),
            GitHubLink = NormalizeUrl(gitHubLink),
            LinkedInLink = NormalizeUrl(linkedInLink),
            InfoAccuracyConfirmed = infoAccuracyConfirmed,
            TermsAccepted = termsAccepted,
            IsPublic = isPublic,
        };
    }

    public void Update(
        string title,
        decimal? privateTeachingCost,
        decimal? hourlyTeachingCost,
        string? workExperience,
        string descriptionHtml,
        string? websiteUrl,
        string? websiteTitle,
        string? contactPhone,
        string? baleLink,
        string? telegramLink,
        string? whatsAppLink,
        string? gitHubLink,
        string? linkedInLink,
        IReadOnlyList<string> tags,
        bool infoAccuracyConfirmed,
        bool termsAccepted,
        bool isPublic)
    {
        Title = title.Trim();
        PrivateTeachingCost = privateTeachingCost;
        HourlyTeachingCost = hourlyTeachingCost;
        WorkExperience = workExperience?.Trim();
        DescriptionHtml = descriptionHtml ?? string.Empty;
        TagsJson = SerializeTags(tags);
        WebsiteUrl = NormalizeUrl(websiteUrl);
        WebsiteTitle = websiteTitle?.Trim();
        ContactPhone = contactPhone?.Trim();
        BaleLink = NormalizeUrl(baleLink);
        TelegramLink = NormalizeUrl(telegramLink);
        WhatsAppLink = NormalizeUrl(whatsAppLink);
        GitHubLink = NormalizeUrl(gitHubLink);
        LinkedInLink = NormalizeUrl(linkedInLink);
        InfoAccuracyConfirmed = infoAccuracyConfirmed;
        TermsAccepted = termsAccepted;
        IsPublic = isPublic;
    }

    public void SubmitForReview()
    {
        ApprovalStatus = TeacherApprovalStatus.Pending;
        RejectionNote = null;
        SubmittedAtUtc = DateTime.UtcNow;
        IsPublic = false;
    }

    public void SetApprovalStatus(TeacherApprovalStatus status, string? rejectionNote = null)
    {
        ApprovalStatus = status;
        RejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
        IsPublic = status == TeacherApprovalStatus.Approved;
    }

    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;

    public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
    {
        SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
        MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
        OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
    }

    public void BumpListing(int starLevel, DateTime utcNow)
    {
        LastBumpedAtUtc = utcNow;
        if (starLevel > ListingStarLevel)
            ListingStarLevel = starLevel;
    }

    public void ManualBumpListing(int starLevel, DateTime utcNow)
    {
        BumpListing(starLevel, utcNow);
        LastManualBumpAtUtc = utcNow;
    }

    public bool CanManualBump(DateTime utcNow, int cooldownMinutes)
    {
        if (LastManualBumpAtUtc is null)
            return true;

        var minutes = cooldownMinutes > 0 ? cooldownMinutes : 25;
        return LastManualBumpAtUtc.Value.AddMinutes(minutes) <= utcNow;
    }

    public void SetListingStarLevel(int starLevel) => ListingStarLevel = starLevel;

    public IReadOnlyList<string> GetTags() => ParseTags(TagsJson);

    public static string SerializeTags(IReadOnlyList<string>? tags)
    {
        if (tags == null || tags.Count == 0) return "[]";
        var cleaned = tags
            .Select(t => t?.Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToList();
        return System.Text.Json.JsonSerializer.Serialize(cleaned);
    }

    public static IReadOnlyList<string> ParseTags(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<string>();
        try
        {
            var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(json);
            return list?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToList()
                   ?? (IReadOnlyList<string>)Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static string? NormalizeUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;
        return url.Trim();
    }
}
