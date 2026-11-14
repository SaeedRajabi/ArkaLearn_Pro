using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteSeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class FavoriteSeminarCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<FavoriteSeminar, ArkaSoftwareCommandDbContext>(dbContext), IFavoriteSeminarCommandRepository
    {
        public async Task<bool> ExistsAsync(long userId, long seminarId)
        {
            return await _dbContext.FavoriteSeminars.AnyAsync(x => x.UserId == userId && x.SeminarId == seminarId);
        }

        public async Task<FavoriteSeminar?> GetByUserAndSeminarAsync(long userId, long seminarId)
        {
            return await _dbContext.FavoriteSeminars
                .FirstOrDefaultAsync(x => x.UserId == userId && x.SeminarId == seminarId);
        }
    }
}
