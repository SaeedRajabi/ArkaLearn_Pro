using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticle;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class AddArticleCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        TeacherAdvertisingEntitlements entitlements,
        TeacherXpService teacherXpService,
        IHttpContextAccessor httpContextAccessor,
        IEntityTitleUniquenessChecker titleUniquenessChecker,
        UserEmailVerificationGuard emailVerificationGuard,
        ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
        : CommandHandler<AddArticle, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddArticle command)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var authorUserId))
                return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

            var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(authorUserId);
            if (!emailCheck.Ok)
            {
                AddMessage(emailCheck.Message);
                return await ResultAsync(emailCheck.Message, ApplicationServiceStatus.ValidationError);
            }

            command.Title = (command.Title ?? string.Empty).Trim();
            command.Summary = (command.Summary ?? string.Empty).Trim();
            command.Content = command.Content ?? string.Empty;
            command.Slug = (command.Slug ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(command.Title))
            {
                AddMessage("Title is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            if (command.Summary.Length > 500)
            {
                AddMessage("Summary must be at most 500 characters.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            if (await titleUniquenessChecker.ArticleTitleExistsAsync(command.Title))
            {
                AddMessage("An article with this title already exists.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
            }

            var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(authorUserId);
            if (teacher != null && !IsAdminUser())
            {
                var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);
                if (!hasPaid)
                {
                    var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
                    var articleCount = await articleCommandRepository.CountByAuthorUserIdAsync(authorUserId);
                    if (articleCount >= settings.FreeMaxArticles)
                        return await ResultAsync(
                            $"Free plan allows up to {settings.FreeMaxArticles} article(s).",
                            ApplicationServiceStatus.ValidationError);
                }
            }

            string? thumbnailUrl = null;
            if (command.ThumbnailUrl != null && command.ThumbnailUrl.Length > 0)
            {
                thumbnailUrl = await fileStoragePathSaver.SavePublicAsync(command.ThumbnailUrl, "images/articles");
            }
            else if (!string.IsNullOrWhiteSpace(command.LibraryThumbnailUrl))
            {
                thumbnailUrl = command.LibraryThumbnailUrl.Trim();
            }

            var uniqueSlug = await EnsureUniqueSlugAsync(string.IsNullOrWhiteSpace(command.Slug) ? SlugifyTitle(command.Title) : command.Slug);

            var article = new Article(
                new ArticleTitle(command.Title),
                new ArticleSummary(command.Summary),
                new ArticleContent(command.Content),
                new Slug(uniqueSlug),
                thumbnailUrl,
                authorUserId,
                command.CategoryId,
                isPublished: false);

            if (command.IsPublished)
            {
                if (IsAdminUser())
                    article.ApproveModeration();
                else
                    article.SubmitForModeration();
            }

            article.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            var tagNames = ParseTagNames(command.TagsJson);

            await articleCommandRepository.InsertAsync(article);
            await articleCommandRepository.CommitAsync();
            await articleCommandRepository.SyncTagsAsync(article.Id, tagNames);
            await articleCommandRepository.CommitAsync();

            if (command.IsPublished)
            {
                var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
                await teacherXpService.TryAwardOnceByUserIdAsync(
                    authorUserId,
                    settings.XpRewardPublishArticle,
                    TeacherXpEventReason.PublishArticle,
                    article.Id);
            }

            return await OkAsync(command.IsPublished
                ? IsAdminUser()
                    ? "Article added and published."
                    : "Article submitted for admin review."
                : "Article added successfully.");
        }

        private static List<string> ParseTagNames(string? tagsJson)
        {
            if (string.IsNullOrWhiteSpace(tagsJson))
                return new List<string>();

            try
            {
                var list = JsonConvert.DeserializeObject<List<string>>(tagsJson) ?? new List<string>();
                return list
                    .SelectMany(SplitLooseList)
                    .Select(x => x?.Trim())
                    .Select(x => x?.TrimStart('#'))
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => x!.Length > 100 ? x[..100].Trim() : x)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()!;
            }
            catch
            {
                return SplitLooseList(tagsJson)
                    .Select(x => x.Trim().TrimStart('#'))
                    .Where(x => x.Length >= 2)
                    .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
        }

        private static IEnumerable<string> SplitLooseList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return Array.Empty<string>();

            return Regex
                .Split(value, @"[\r\n;؛,،]+")
                .Select(x => x.Trim())
                .Where(x => x.Length > 0);
        }

        private static string ToPublicWebPath(string savedPath)
        {
            if (string.IsNullOrWhiteSpace(savedPath))
                return string.Empty;

            var normalized = savedPath.Replace("\\", "/");
            var webRootIndex = normalized.LastIndexOf("/wwwroot/", StringComparison.OrdinalIgnoreCase);

            if (webRootIndex >= 0)
                normalized = normalized[(webRootIndex + "/wwwroot".Length)..];
            else if (normalized.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
                normalized = normalized["wwwroot".Length..];

            if (!normalized.StartsWith("/"))
                normalized = "/" + normalized;

            return normalized;
        }

        private bool IsAdminUser()
        {
            var roleClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;
            return roleClaim?.ToLowerInvariant() is "3" or "admin" or "super admin";
        }

        private async Task<string> EnsureUniqueSlugAsync(string baseSlug)
        {
            var normalized = string.IsNullOrWhiteSpace(baseSlug) ? "article" : baseSlug.Trim().ToLowerInvariant();
            if (normalized.Length > 250)
                normalized = normalized[..250].TrimEnd('-');

            var candidate = normalized;
            var counter = 2;
            while (await articleCommandRepository.SlugExistsAsync(candidate))
            {
                var suffix = $"-{counter}";
                var maxBaseLength = 250 - suffix.Length;
                var trimmedBase = normalized.Length > maxBaseLength ? normalized[..maxBaseLength].TrimEnd('-') : normalized;
                candidate = $"{trimmedBase}{suffix}";
                counter++;
            }

            return candidate;
        }

        private static string SlugifyTitle(string title)
        {
            var slug = Regex.Replace(title.Trim().ToLowerInvariant(), @"\s+", "-");
            slug = Regex.Replace(slug, @"[^a-z0-9\u0600-\u06FF-]+", "");
            slug = Regex.Replace(slug, @"-+", "-").Trim('-');
            return string.IsNullOrWhiteSpace(slug) ? "article" : slug;
        }
    }
}
