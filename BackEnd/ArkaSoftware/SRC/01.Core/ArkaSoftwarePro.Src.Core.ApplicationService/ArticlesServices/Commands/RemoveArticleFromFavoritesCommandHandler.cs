using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class RemoveArticleFromFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IFavoriteArticleCommandRepository favoriteArticleCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<RemoveArticleFromFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(RemoveArticleFromFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var favorite = await favoriteArticleCommandRepository.GetByUserAndArticleAsync(userId, command.ArticleId);
                if (favorite == null)
                    return await ResultAsync("Favorite Article Not Found.", ApplicationServiceStatus.NotFound);

                favoriteArticleCommandRepository.Delete(favorite);
                await favoriteArticleCommandRepository.CommitAsync();

                return await OkAsync("Article Removed From Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Remove From Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
