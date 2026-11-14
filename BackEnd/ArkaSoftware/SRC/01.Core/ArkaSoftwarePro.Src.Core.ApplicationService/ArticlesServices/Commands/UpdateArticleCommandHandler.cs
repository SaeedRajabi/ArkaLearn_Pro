using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.UpdateArticle;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class UpdateArticleCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        TeacherXpService teacherXpService,
        IEntityTitleUniquenessChecker titleUniquenessChecker,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<UpdateArticle, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpdateArticle command)
        {
            var article = await articleCommandRepository.GetAsync(command.Id);
            if (article == null)
                return await ResultAsync($"Article with Id {command.Id} was not found.", ApplicationServiceStatus.NotFound);

            if (!CanManageArticle(article.AuthorUserId))
                return await ResultAsync("You are not allowed to update this article.", ApplicationServiceStatus.ValidationError);

            if (await titleUniquenessChecker.ArticleTitleExistsAsync(command.Title, command.Id))
            {
                AddMessage("An article with this title already exists.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
            }

            var thumbnailUrl = command.ThumbnailUrl;
            if (!string.IsNullOrEmpty(thumbnailUrl) && (thumbnailUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase) || thumbnailUrl.Length > 500))
                thumbnailUrl = null;

            article.UpdateContent(
                new ArticleTitle(command.Title),
                new ArticleSummary(command.Summary),
                new ArticleContent(command.Content),
                thumbnailUrl);

            article.UpdateSlug(new Slug(command.Slug));
            article.UpdateCategory(command.CategoryId);
            article.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            var wantsPublish = command.IsPublished;
            if (wantsPublish)
            {
                if (IsAdminUser())
                    article.ApproveModeration();
                else
                    article.SubmitForModeration();
            }
            else if (!command.IsPublished && article.IsPublished)
                article.Unpublish();

            if (command.TagsJson != null)
                await articleCommandRepository.SyncTagsAsync(article.Id, ParseTagNames(command.TagsJson));

            await articleCommandRepository.CommitAsync();

            if (wantsPublish)
            {
                var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
                await teacherXpService.TryAwardOnceByUserIdAsync(
                    article.AuthorUserId,
                    settings.XpRewardPublishArticle,
                    TeacherXpEventReason.PublishArticle,
                    article.Id);
            }

            return await OkAsync(wantsPublish
                ? IsAdminUser()
                    ? "Article updated and published."
                    : "Article updated and submitted for admin review."
                : "Article updated successfully.");
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
                    .Select(x => x.Trim().TrimStart('#'))
                    .Where(x => x.Length >= 2)
                    .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
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

        private bool IsAdminUser()
        {
            var roleClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value;
            return roleClaim?.ToLowerInvariant() is "3" or "admin" or "super admin";
        }

        private bool CanManageArticle(long authorUserId)
        {
            if (IsAdminUser())
                return true;

            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("nameid")?.Value;

            return long.TryParse(userIdClaim, out var userId) && userId > 0 && userId == authorUserId;
        }
    }
}
