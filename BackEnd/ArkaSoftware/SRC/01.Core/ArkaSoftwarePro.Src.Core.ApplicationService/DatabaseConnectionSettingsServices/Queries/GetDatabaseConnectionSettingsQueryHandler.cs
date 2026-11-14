using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Queries.GetDatabaseConnectionSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DatabaseConnectionSettingsServices.Queries;

public class GetDatabaseConnectionSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDatabaseConnectionSettingsQueryRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetDatabaseConnectionSettingsQuery, DatabaseConnectionSettingsQri>(outer)
{
    public override async Task<QueryResult<DatabaseConnectionSettingsQri>> Handle(GetDatabaseConnectionSettingsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var row = await repository.GetCurrentAsync();
            if (row is null)
            {
                return await ResultAsync(new DatabaseConnectionSettingsQri
                {
                    UseDatabaseConnection = false,
                    BootstrapSource = "BootstrapDB",
                }, ApplicationServiceStatus.Ok);
            }

            return await ResultAsync(row, ApplicationServiceStatus.Ok);
        }
        catch (Exception ex) when (IsMissingSettingsTable(ex))
        {
            return await ResultAsync(new DatabaseConnectionSettingsQri
            {
                UseDatabaseConnection = false,
                BootstrapSource = "BootstrapDB",
            }, ApplicationServiceStatus.Ok);
        }
    }

    private static bool IsMissingSettingsTable(Exception ex)
        => ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
           || ex.InnerException?.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase) == true;
}
