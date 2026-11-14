using ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class AboutUsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<AboutUsPage, ArkaSoftwareCommandDbContext>(dbContext), IAboutUsCommandRepository
    {
        public async Task<AboutUsPage?> GetCurrentPageAsync()
        {
            return await _dbContext.AboutUsPages
                .Include(x => x.TeamMembers)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();
        }
    }
}
