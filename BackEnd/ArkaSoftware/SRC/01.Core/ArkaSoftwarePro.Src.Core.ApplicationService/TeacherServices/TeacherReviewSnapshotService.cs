using System.Text.Json;
using System.Text.RegularExpressions;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public static class TeacherReviewSnapshotService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    public static string BuildProfileSnapshot(Teacher teacher, string? headline)
    {
        var educationsText = string.Join("\n", teacher.TeacherEducations
            .OrderBy(e => e.Id)
            .Select(e => $"- {(string?)e.NameOfInstitutionOrUniversity ?? string.Empty} ({e.TypeOfDegree})"));
        var skillsText = string.Join("\n", teacher.TeacherExpertiseAreas
            .OrderBy(s => s.Id)
            .Select(s => $"- {s.Name?.Value ?? string.Empty} ({s.Rate?.Value}/10)"));

        var payload = new Dictionary<string, object?>
        {
            ["shortDescription"] = teacher.ShortDescription,
            ["longDescription"] = teacher.LongDescription?.Value,
            ["headerImageUrl"] = teacher.HeaderImageUrl,
            ["teachingCategoryId"] = teacher.TeachingCategoryId?.ToString(),
            ["headline"] = headline,
            ["educations"] = string.IsNullOrWhiteSpace(educationsText) ? null : educationsText,
            ["skills"] = string.IsNullOrWhiteSpace(skillsText) ? null : skillsText,
        };
        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    public static string BuildAdvertisementSnapshot(TeacherAdvertisement ad) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = ad.Title,
            ["description"] = StripHtml(ad.DescriptionHtml),
            ["workExperience"] = ad.WorkExperience,
            ["privateTeachingCost"] = ad.PrivateTeachingCost?.ToString(),
            ["hourlyTeachingCost"] = ad.HourlyTeachingCost?.ToString(),
            ["tags"] = string.Join(", ", ad.GetTags()),
            ["websiteUrl"] = ad.WebsiteUrl,
            ["websiteTitle"] = ad.WebsiteTitle,
            ["contactPhone"] = ad.ContactPhone,
            ["baleLink"] = ad.BaleLink,
            ["telegramLink"] = ad.TelegramLink,
            ["whatsAppLink"] = ad.WhatsAppLink,
            ["gitHubLink"] = ad.GitHubLink,
            ["linkedInLink"] = ad.LinkedInLink,
        }, JsonOptions);

    public static string BuildVideoSnapshot(TeacherPromotionalVideo video) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = video.Title,
            ["videoUrl"] = video.VideoUrl,
            ["thumbnailUrl"] = video.ThumbnailUrl,
            ["sortOrder"] = video.SortOrder,
        }, JsonOptions);

    public static string BuildBookSnapshot(TeacherBook book) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = book.Title,
            ["description"] = book.Description,
            ["longDescription"] = StripHtml(book.LongDescriptionHtml),
            ["publisher"] = book.Publisher,
            ["publicationYear"] = book.PublicationYear?.ToString(),
            ["isbn"] = book.Isbn,
            ["tags"] = string.Join(", ", TeacherAdvertisement.ParseTags(book.TagsJson)),
            ["coverImageUrl"] = book.CoverImageUrl,
        }, JsonOptions);

    public static string BuildSoftwareSnapshot(SoftwareProduct software) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = software.Title,
            ["description"] = software.Description,
            ["longDescription"] = StripHtml(software.LongDescriptionHtml),
            ["tags"] = string.Join(", ", software.GetTags()),
            ["coverImageUrl"] = software.CoverImageUrl,
            ["installerFileName"] = software.InstallerFileName,
            ["categoryId"] = software.CategoryId?.ToString(),
        }, JsonOptions);

    public static string BuildPortfolioArticleSnapshot(TeacherPortfolioArticle article) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = article.Title,
            ["summary"] = article.Summary,
            ["content"] = article.Content,
        }, JsonOptions);

    public static string BuildResumeSnapshot(TeacherResume resume) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = resume.Title,
            ["description"] = resume.Description,
            ["pdfFileUrl"] = resume.PdfFileUrl,
            ["pdfFileName"] = resume.PdfFileName,
        }, JsonOptions);

    public static string BuildPlatformArticleSnapshot(string title, string summary, string content) =>
        JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["title"] = title,
            ["summary"] = summary,
            ["content"] = content,
        }, JsonOptions);

    public static Dictionary<string, JsonElement>? ParseSnapshot(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        }
        catch
        {
            return null;
        }
    }

    public static string StripHtml(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return string.Empty;
        return Regex.Replace(html, "<[^>]+>", " ").Replace("&nbsp;", " ").Trim();
    }
}
