using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Domain.Caching;
using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices.Queries;

public class GetCacheSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICacheSettingsQueryRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCacheSettingsQuery, CacheSettingsQri>(outer)
{
    public override async Task<QueryResult<CacheSettingsQri>> Handle(GetCacheSettingsQuery query)
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
                return await ResultAsync(new CacheSettingsQri
                {
                    IsEnabled = false,
                    Provider = CacheProviderType.InMemory,
                    DefaultTtlMinutes = 30,
                    CacheCoursesEnabled = true,
                    CacheArticlesEnabled = true,
                    CacheSeminarsEnabled = true,
                    CacheBooksEnabled = true,
                    CacheSoftwareEnabled = true,
                    CacheTeacherAdsEnabled = true,
                    CacheFilesEnabled = true,
                    CacheCategoriesEnabled = true,
                    CacheTeachersEnabled = true,
                    CacheProjectsEnabled = true,
                }, ApplicationServiceStatus.Ok);
            }

            return await ResultAsync(row, ApplicationServiceStatus.Ok);
        }
        catch (Exception ex) when (IsMissingSettingsTable(ex))
        {
            return await ResultAsync(new CacheSettingsQri
            {
                IsEnabled = false,
                Provider = CacheProviderType.InMemory,
                DefaultTtlMinutes = 30,
            }, ApplicationServiceStatus.Ok);
        }
    }

    private static bool IsMissingSettingsTable(Exception ex)
        => ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
           || ex.InnerException?.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase) == true;
}
