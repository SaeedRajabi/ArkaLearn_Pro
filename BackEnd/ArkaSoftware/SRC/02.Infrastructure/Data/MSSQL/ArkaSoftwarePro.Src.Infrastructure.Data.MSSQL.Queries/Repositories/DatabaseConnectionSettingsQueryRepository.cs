using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Queries.GetDatabaseConnectionSettings;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class DatabaseConnectionSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IDatabaseConnectionSettingsQueryRepository
{
    public async Task<DatabaseConnectionSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var row = await dbContext.DatabaseConnectionSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null)
            return null;

        return new DatabaseConnectionSettingsQri
        {
            UseDatabaseConnection = row.UseDatabaseConnection,
            Server = row.Server,
            Port = row.Port,
            Database = row.Database,
            UserId = row.UserId,
            HasPassword = !string.IsNullOrWhiteSpace(row.PasswordEncrypted),
            TrustServerCertificate = row.TrustServerCertificate,
            MultipleActiveResultSets = row.MultipleActiveResultSets,
            BootstrapSource = "BootstrapDB",
        };
    }
}
