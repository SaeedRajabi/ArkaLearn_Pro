using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class BasketQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IBasketQueryRepository
    {
        public async Task<IEnumerable<GetBasketCoursesQri>> GetBasketCoursesExecuteAsync(GetBasketCourseByIdQuery query)
        {
            return await _dbContext.Baskets
                .Where(x => x.BasketId == query.BasketId)
                .SelectMany(x => x.BasketItems)
                .Select(item => new GetBasketCoursesQri
                {
                    Quantity = item.Quantity,
                    CourseCategory = item.Course.Category == null ? string.Empty : item.Course.Category.Title,
                    CourseName = item.Course.Title ?? string.Empty,
                    CourseUnitPrice = item.Course.Price ?? 0
                })
                .ToListAsync();

        }

    }
}
