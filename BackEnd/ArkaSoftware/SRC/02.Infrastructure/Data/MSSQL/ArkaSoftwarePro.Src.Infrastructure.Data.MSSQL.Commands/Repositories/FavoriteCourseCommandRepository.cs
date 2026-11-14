using ArkaSoftwarePro.Src.Core.Contracts.Favorites.FavoriteCourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class FavoriteCourseCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<FavoriteCourse, ArkaSoftwareCommandDbContext>(dbContext), IFavoriteCourseCommandRepository
    {
        public async Task<bool> ExistsAsync(long userId, long courseId)
        {
            return await _dbContext.FavoriteCourses.AnyAsync(x => x.UserId == userId && x.CourseId == courseId);
        }

        public async Task<FavoriteCourse?> GetByUserAndCourseAsync(long userId, long courseId)
        {
            return await _dbContext.FavoriteCourses
                .FirstOrDefaultAsync(x => x.UserId == userId && x.CourseId == courseId);
        }
    }
}
