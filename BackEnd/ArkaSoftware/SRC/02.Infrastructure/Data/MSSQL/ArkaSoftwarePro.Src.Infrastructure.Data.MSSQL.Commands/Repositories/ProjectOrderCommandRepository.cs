using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ProjectOrderCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<ProjectOrder, ArkaSoftwareCommandDbContext>(dbContext), IProjectOrderCommandRepository
{
    public async Task<int> GetNextRequestNumberAsync()
    {
        var max = await _dbContext.Set<ProjectOrder>()
            .AsNoTracking()
            .MaxAsync(x => (int?)x.RequestNumber) ?? 0;
        return max + 1;
    }

    public async Task<List<long>> GetAdminUserIdsAsync()
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.Role == UserRole.ADMIN && !x.IsDelete)
            .Select(x => x.Id)
            .ToListAsync();
    }
}
