using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteCourseRepositoryContracts.Commands
{
    public interface IFavoriteCourseCommandRepository : ICommandRepository<FavoriteCourse, long>
    {
        Task<bool> ExistsAsync(long userId, long courseId);
        Task<FavoriteCourse?> GetByUserAndCourseAsync(long userId, long courseId);
    }
}
