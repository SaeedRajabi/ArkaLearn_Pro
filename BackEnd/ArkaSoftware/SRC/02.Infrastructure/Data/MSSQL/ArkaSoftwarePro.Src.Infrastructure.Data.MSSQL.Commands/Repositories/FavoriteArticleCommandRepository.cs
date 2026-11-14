using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class FavoriteArticleCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<FavoriteArticle, ArkaSoftwareCommandDbContext>(dbContext), IFavoriteArticleCommandRepository
    {
        public async Task<bool> ExistsAsync(long userId, long articleId)
        {
            return await _dbContext.FavoriteArticles.AnyAsync(x => x.UserId == userId && x.ArticleId == articleId);
        }

        public async Task<FavoriteArticle?> GetByUserAndArticleAsync(long userId, long articleId)
        {
            return await _dbContext.FavoriteArticles
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ArticleId == articleId);
        }
    }
}
