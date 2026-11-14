using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryDbContext;


namespace Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories
{
    public class BaseQueryRepository<TDbContext>(TDbContext dbContext) : IQueryRepository
        where TDbContext : BaseQueryDbContext
    {
        protected readonly TDbContext _dbContext = dbContext;
    }
}
