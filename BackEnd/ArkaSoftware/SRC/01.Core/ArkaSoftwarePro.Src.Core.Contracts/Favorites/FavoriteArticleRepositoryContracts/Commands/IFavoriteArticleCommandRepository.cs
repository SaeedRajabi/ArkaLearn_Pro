using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteArticleRepositoryContracts.Commands
{
    public interface IFavoriteArticleCommandRepository : ICommandRepository<FavoriteArticle, long>
    {
        Task<bool> ExistsAsync(long userId, long articleId);
        Task<FavoriteArticle?> GetByUserAndArticleAsync(long userId, long articleId);
    }
}
