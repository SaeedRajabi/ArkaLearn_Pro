using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class IPBlacklistQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IIPBlacklistQueryRepository
{
    public async Task<bool> IsIpBlockedAsync(string ipAddress, CancellationToken cancellationToken = default)
    {
        var normalized = ipAddress.Trim();
        return await dbContext.IPBlacklists
            .AsNoTracking()
            .AnyAsync(x => !x.IsDelete
                           && x.ExpirationDate > DateTime.UtcNow
                           && x.IPAddress == normalized,
                      cancellationToken);
    }

    public async Task<PagedData<IPBlacklistListItemQri>?> SearchAsync(
        string? inputValue,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var term = (inputValue ?? string.Empty).Trim();
        var query = dbContext.IPBlacklists.AsNoTracking()
            .Where(x => !x.IsDelete);

        if (!string.IsNullOrWhiteSpace(term))
        {
            query = query.Where(x =>
                (x.IPAddress != null && x.IPAddress.Contains(term))
                || (x.Reason != null && x.Reason.Contains(term))
                || (x.DeviceInformation != null && x.DeviceInformation.Contains(term)));
        }

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderByDescending(x => x.AddedDate)
            .Skip(Math.Max(0, pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new IPBlacklistListItemQri
            {
                Id = x.Id,
                IpAddress = x.IPAddress ?? string.Empty,
                DeviceInformation = x.DeviceInformation ?? string.Empty,
                Reason = x.Reason ?? string.Empty,
                AddedDate = x.AddedDate,
                ExpirationDate = x.ExpirationDate,
                IsPermanent = x.ExpirationDate.Year >= 9999,
            })
            .ToListAsync(cancellationToken);

        return new PagedData<IPBlacklistListItemQri>
        {
            QueryResult = rows,
            TotalCount = total,
        };
    }
}
