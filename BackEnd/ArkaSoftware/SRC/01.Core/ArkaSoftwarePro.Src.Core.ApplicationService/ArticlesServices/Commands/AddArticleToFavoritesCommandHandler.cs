using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.Favorites;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Commands
{
    public class AddArticleToFavoritesCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleCommandRepository articleCommandRepository,
        IFavoriteArticleCommandRepository favoriteArticleCommandRepository,
        IHttpContextAccessor httpContextAccessor)
        : CommandHandler<AddArticleToFavoritesCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddArticleToFavoritesCommand command)
        {
            try
            {
                var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
                    x.Type == ClaimTypes.NameIdentifier ||
                    x.Type == "userId" ||
                    x.Type == "nameid");

                if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value) || !long.TryParse(userIdClaim.Value, out var userId))
                    return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

                var article = await articleCommandRepository.GetAsync(command.ArticleId);
                if (article == null!)
                    return await ResultAsync($"Article With Id : {command.ArticleId} Is Not Defined.", ApplicationServiceStatus.NotFound);

                var exists = await favoriteArticleCommandRepository.ExistsAsync(userId, command.ArticleId);
                if (exists)
                    return await OkAsync("Article Already In Favorites.");

                var favorite = new FavoriteArticle(userId, command.ArticleId);
                await favoriteArticleCommandRepository.InsertAsync(favorite);
                await favoriteArticleCommandRepository.CommitAsync();

                return await OkAsync("Article Added To Favorites.");
            }
            catch (Exception ex)
            {
                return await ResultAsync($"Add To Favorites Has Error: {ex.Message}", ApplicationServiceStatus.Exception);
            }
        }
    }
}
