using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class IPBlacklistCommandRepository(ArkaSoftwareCommandDbContext dbContext) : IIPBlacklistCommandRepository
{
    public Task<IPBlacklist?> GetAsync(long id)
        => dbContext.IPBlacklists.FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete)!;

    public async Task<IPBlacklist?> GetActiveByIpAsync(string ipAddress)
    {
        var normalized = ipAddress.Trim();
        return await dbContext.IPBlacklists
            .FirstOrDefaultAsync(x =>
                !x.IsDelete
                && x.ExpirationDate > DateTime.UtcNow
                && x.UserEnvironmentInfo != null
                && x.UserEnvironmentInfo.IPAddress == normalized);
    }

    public async Task InsertEntryAsync(IPBlacklist entry)
        => await dbContext.IPBlacklists.AddAsync(entry);

    public Task CommitAsync()
        => dbContext.SaveChangesAsync();
}
