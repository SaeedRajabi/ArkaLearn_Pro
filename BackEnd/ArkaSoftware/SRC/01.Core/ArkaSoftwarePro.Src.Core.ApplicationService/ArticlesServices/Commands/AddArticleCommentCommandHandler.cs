using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticleComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class AddArticleCommentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository,
        EngagementNotifier engagementNotifier,
        UserEmailVerificationGuard emailVerificationGuard,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddArticleComment, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddArticleComment command)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

            var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(userId);
            if (!emailCheck.Ok)
            {
                AddMessage(emailCheck.Message);
                return await ResultAsync(emailCheck.Message, ApplicationServiceStatus.ValidationError);
            }

            var article = await articleCommandRepository.GetAsync(command.ArticleId);
            if (article == null)
                return await ResultAsync($"Article With Id : {command.ArticleId} Is Not Defined.", ApplicationServiceStatus.NotFound);

            var parentId = command.ParentId > 0 ? command.ParentId : (long?)null;
            var newComment = article.AddComment(userId, new CommentContent(command.Content), command.Rating, command.Like, parentId);
            await articleCommandRepository.CommitAsync();

            var displayName = httpContextAccessor.HttpContext?.User?.Identity?.Name
                ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? $"User {userId}";

            if (article.AuthorUserId > 0 && article.AuthorUserId != userId)
            {
                await engagementNotifier.NotifyArticleCommentSubmittedAsync(
                    article.Id,
                    article.AuthorUserId,
                    article.Title?.Value ?? "Article",
                    displayName,
                    newComment.Id,
                    parentId);
            }
            else
            {
                await engagementNotifier.NotifyArticleCommentLiveAsync(
                    article.Id,
                    newComment.Id,
                    parentId,
                    []);
            }

            return await OkAsync("Comment added successfully.");
        }
    }
}
