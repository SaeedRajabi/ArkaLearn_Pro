using ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class ContactUsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<ContactUsPage, ArkaSoftwareCommandDbContext>(dbContext), IContactUsCommandRepository
    {
        public async Task<ContactUsPage?> GetCurrentPageAsync()
        {
            return await _dbContext.ContactUsPages
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();
        }
    }
}
