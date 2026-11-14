using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherReviewChanges;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherReviewChangesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IArticleCommandRepository articleCommandRepository,
    ISoftwareCommandRepository softwareCommandRepository)
    : QueryHandler<GetTeacherReviewChangesQuery, TeacherReviewChangesQri>(outer)
{
    public override async Task<QueryResult<TeacherReviewChangesQri>> Handle(GetTeacherReviewChangesQuery query)
    {
        var reviewType = (query.ReviewType ?? "profile").Trim().ToLowerInvariant();

        return reviewType switch
        {
            "profile" => await BuildProfileChangesAsync(query.TeacherId),
            "advertisement" or "ad" => await BuildAdvertisementChangesAsync(query.TeacherId > 0 ? query.TeacherId : query.ContentId),
            "video" or "promotional_video" => await BuildVideoChangesAsync(query.ContentId),
            "book" => await BuildBookChangesAsync(query.ContentId),
            "software" => await BuildSoftwareChangesAsync(query.ContentId),
            "portfolio_article" => await BuildPortfolioArticleChangesAsync(query.ContentId),
            "resume" or "cv" => await BuildResumeChangesAsync(query.TeacherId > 0 ? query.TeacherId : query.ContentId),
            "article" or "platform_article" => await BuildPlatformArticleChangesAsync(query.ContentId),
            _ => await ResultAsync(null!, ApplicationServiceStatus.ValidationError),
        };
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildProfileChangesAsync(long teacherId)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var userId = teacher.UserId ?? 0;
        var profile = await teacherQueryRepository.GetProfileAsync(
            new GetTeacherProfileQuery { TeacherId = teacher.Id, ForEdit = true },
            includeUnapproved: true);

        var headline = profile?.Headline ?? (string?)teacher.TeacherEducations.FirstOrDefault()?.NameOfInstitutionOrUniversity ?? string.Empty;
        var educationsText = string.Join("\n", teacher.TeacherEducations
            .OrderBy(e => e.Id)
            .Select(e => $"- {(string?)e.NameOfInstitutionOrUniversity ?? string.Empty} ({e.TypeOfDegree})"));
        var skillsText = string.Join("\n", teacher.TeacherExpertiseAreas
            .OrderBy(s => s.Id)
            .Select(s => $"- {s.Name?.Value} ({s.Rate?.Value}/10)"));

        var result = TeacherReviewDiffBuilder.Build(
            "profile",
            teacher.Id,
            teacher.Id,
            teacher.ProfileApprovedSnapshotJson,
            [
                ("shortDescription", "Short description", teacher.ShortDescription),
                ("longDescription", "Long description", teacher.LongDescription?.Value),
                ("headerImageUrl", "Header image URL", teacher.HeaderImageUrl),
                ("teachingCategoryId", "Teaching category ID", teacher.TeachingCategoryId?.ToString()),
                ("headline", "Headline", headline),
                ("educations", "Educations", string.IsNullOrWhiteSpace(educationsText) ? null : educationsText),
                ("skills", "Skills", string.IsNullOrWhiteSpace(skillsText) ? null : skillsText),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildAdvertisementChangesAsync(long teacherId)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
        var ad = teacher?.Advertisement;
        if (teacher == null || ad == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "advertisement",
            teacher.Id,
            teacher.Id,
            ad.ApprovedSnapshotJson,
            [
                ("title", "Title", ad.Title),
                ("description", "Description", TeacherReviewSnapshotService.StripHtml(ad.DescriptionHtml)),
                ("workExperience", "Work experience", ad.WorkExperience),
                ("privateTeachingCost", "Private teaching cost", ad.PrivateTeachingCost?.ToString()),
                ("hourlyTeachingCost", "Hourly teaching cost", ad.HourlyTeachingCost?.ToString()),
                ("tags", "Tags", string.Join(", ", ad.GetTags())),
                ("websiteUrl", "Website URL", ad.WebsiteUrl),
                ("websiteTitle", "Website title", ad.WebsiteTitle),
                ("contactPhone", "Contact phone", ad.ContactPhone),
                ("baleLink", "Bale link", ad.BaleLink),
                ("telegramLink", "Telegram link", ad.TelegramLink),
                ("whatsAppLink", "WhatsApp link", ad.WhatsAppLink),
                ("gitHubLink", "GitHub link", ad.GitHubLink),
                ("linkedInLink", "LinkedIn link", ad.LinkedInLink),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildVideoChangesAsync(long videoId)
    {
        var teacher = await teacherCommandRepository.GetByPromotionalVideoIdAsync(videoId);
        var video = teacher?.PromotionalVideos.FirstOrDefault(v => v.Id == videoId);
        if (teacher == null || video == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "video",
            teacher.Id,
            video.Id,
            video.ApprovedSnapshotJson,
            [
                ("title", "Title", video.Title),
                ("videoUrl", "Video URL", video.VideoUrl),
                ("thumbnailUrl", "Thumbnail URL", video.ThumbnailUrl),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildBookChangesAsync(long bookId)
    {
        var teacher = await teacherCommandRepository.GetByBookIdAsync(bookId);
        var book = teacher?.Books.FirstOrDefault(b => b.Id == bookId);
        if (teacher == null || book == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "book",
            teacher.Id,
            book.Id,
            book.ApprovedSnapshotJson,
            [
                ("title", "Title", book.Title),
                ("description", "Short description", book.Description),
                ("longDescription", "Long description", TeacherReviewSnapshotService.StripHtml(book.LongDescriptionHtml)),
                ("coverImageUrl", "Cover image URL", book.CoverImageUrl),
                ("publisher", "Publisher", book.Publisher),
                ("publicationYear", "Publication year", book.PublicationYear?.ToString()),
                ("isbn", "ISBN", book.Isbn),
                ("tags", "Tags", string.Join(", ", TeacherAdvertisement.ParseTags(book.TagsJson))),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildSoftwareChangesAsync(long softwareId)
    {
        var software = await softwareCommandRepository.GetWithTeacherAsync(softwareId);
        if (software?.Teacher == null || software.IsPlatformOwned)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "software",
            software.Teacher.Id,
            software.Id,
            software.ApprovedSnapshotJson,
            [
                ("title", "Title", software.Title),
                ("description", "Short description", software.Description),
                ("longDescription", "Long description", TeacherReviewSnapshotService.StripHtml(software.LongDescriptionHtml)),
                ("tags", "Tags", string.Join(", ", software.GetTags())),
                ("coverImageUrl", "Cover image URL", software.CoverImageUrl),
                ("installerFileName", "Installer file name", software.InstallerFileName),
                ("categoryId", "Category ID", software.CategoryId?.ToString()),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildPortfolioArticleChangesAsync(long articleId)
    {
        var teacher = await teacherCommandRepository.GetByPortfolioArticleIdAsync(articleId);
        var article = teacher?.PortfolioArticles.FirstOrDefault(a => a.Id == articleId);
        if (teacher == null || article == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "portfolio_article",
            teacher.Id,
            article.Id,
            article.ApprovedSnapshotJson,
            [
                ("title", "Title", article.Title),
                ("summary", "Summary", article.Summary),
                ("content", "Content", article.Content),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildResumeChangesAsync(long teacherId)
    {
        var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
        var resume = teacher?.Resume;
        if (teacher == null || resume == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "resume",
            teacher.Id,
            teacher.Id,
            resume.ApprovedSnapshotJson,
            [
                ("title", "Title", resume.Title),
                ("description", "Description", resume.Description),
                ("pdfFileUrl", "PDF file URL", resume.PdfFileUrl),
                ("pdfFileName", "PDF file name", resume.PdfFileName),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private async Task<QueryResult<TeacherReviewChangesQri>> BuildPlatformArticleChangesAsync(long articleId)
    {
        var article = await articleCommandRepository.GetAsync(articleId);
        if (article == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var result = TeacherReviewDiffBuilder.Build(
            "article",
            0,
            article.Id,
            null,
            [
                ("title", "Title", article.Title?.Value),
                ("summary", "Summary", article.Summary?.Value),
                ("content", "Content", article.Content?.Value),
            ]);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
