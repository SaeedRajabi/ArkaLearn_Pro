using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteSeminarRepositoryContracts.Commands
{
    public interface IFavoriteSeminarCommandRepository : ICommandRepository<FavoriteSeminar, long>
    {
        Task<bool> ExistsAsync(long userId, long seminarId);
        Task<FavoriteSeminar?> GetByUserAndSeminarAsync(long userId, long seminarId);
    }
}
