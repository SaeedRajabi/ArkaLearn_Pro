using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticle;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class DeleteArticleCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository,
        IEntityPermanentDeletionService permanentDeletionService,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<DeleteArticle, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(DeleteArticle command)
        {
            var article = await articleCommandRepository.GetAsync(command.Id);
            if (article == null)
                return await ResultAsync($"Article with Id {command.Id} was not found.", ApplicationServiceStatus.NotFound);

            if (!CanManageArticle(article.AuthorUserId))
                return await ResultAsync("You are not allowed to delete this article.", ApplicationServiceStatus.ValidationError);

            var deleted = await permanentDeletionService.PermanentlyDeleteArticleAsync(command.Id);
            if (!deleted)
                return await ResultAsync($"Article with Id {command.Id} was not found.", ApplicationServiceStatus.NotFound);

            return await OkAsync("Article permanently deleted.");
        }

        private bool CanManageArticle(long authorUserId)
        {
            var roleClaim = httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
            if (roleClaim is "3" or "Admin" or "Super Admin")
                return true;

            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("nameid")?.Value;

            return long.TryParse(userIdClaim, out var userId) && userId > 0 && userId == authorUserId;
        }
    }
}
