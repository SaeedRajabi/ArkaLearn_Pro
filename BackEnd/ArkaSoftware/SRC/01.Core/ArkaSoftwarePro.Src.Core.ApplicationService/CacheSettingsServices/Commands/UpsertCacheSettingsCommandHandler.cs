using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

using ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Contracts.Caching;

using ArkaSoftwarePro.Src.Core.Contracts.Security;

using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Commands.UpsertCacheSettings;

using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;

using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Logging;

using CacheSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities.CacheSettings;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices.Commands;



public class UpsertCacheSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICacheSettingsCommandRepository repository,
    ISecretProtector secretProtector,
    ICacheSettingsCache cacheSettingsCache,
    IApplicationCacheService applicationCacheService,
    ICacheWarmupService cacheWarmupService,
    IHttpContextAccessor httpContextAccessor,
    ILogger<UpsertCacheSettingsCommandHandler> logger)
    : CommandHandler<UpsertCacheSettingsCommand, CacheSettingsQri>(outer)
{

    public override async Task<CommandResult<CacheSettingsQri>> Handle(UpsertCacheSettingsCommand command)

    {

        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))

            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);



        if (command.IsEnabled is null)

        {

            AddMessage("IsEnabled is required.");

            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        }



        var isEnabled = command.IsEnabled.Value;

        var provider = string.Equals(command.Provider, CacheProviderType.Redis, StringComparison.OrdinalIgnoreCase)

            ? CacheProviderType.Redis

            : CacheProviderType.InMemory;



        var current = await repository.GetCurrentAsync();

        var passwordEncrypted = current?.RedisPasswordEncrypted;

        if (command.RedisPassword is not null)

        {

            passwordEncrypted = string.IsNullOrWhiteSpace(command.RedisPassword)

                ? null

                : secretProtector.Protect(command.RedisPassword.Trim());

        }



        if (isEnabled && provider == CacheProviderType.Redis)

        {

            var testSettings = new CacheSettingsSnapshot

            {

                IsEnabled = true,

                Provider = CacheProviderType.Redis,

                RedisHost = command.RedisHost,

                RedisPort = command.RedisPort,

                RedisPassword = command.RedisPassword ?? secretProtector.Unprotect(passwordEncrypted),

                RedisInstanceName = command.RedisInstanceName,

                RedisUseSsl = command.RedisUseSsl,

            };

            if (!await applicationCacheService.TestRedisConnectionAsync(testSettings))

                return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        }



        if (current is null)

        {

            current = new CacheSettingsEntity(

                isEnabled,

                provider,

                command.DefaultTtlMinutes,

                command.RedisHost,

                command.RedisPort,

                passwordEncrypted,

                command.RedisInstanceName,

                command.RedisUseSsl,

                command.CacheCoursesEnabled,

                command.CacheArticlesEnabled,

                command.CacheSeminarsEnabled,

                command.CacheBooksEnabled,

                command.CacheSoftwareEnabled,

                command.CacheTeacherAdsEnabled,

                command.CacheFilesEnabled,

                command.CacheCategoriesEnabled,

                command.CacheTeachersEnabled,

                command.CacheProjectsEnabled);

            await repository.InsertAsync(current);

            await repository.CommitAsync();

            // Insert can omit CLR-default false when SQL DEFAULT(1) exists — force the bit.

            await repository.ForceSetIsEnabledAsync(current.Id, isEnabled);

        }

        else

        {

            current.Update(

                isEnabled,

                provider,

                command.DefaultTtlMinutes,

                command.RedisHost,

                command.RedisPort,

                passwordEncrypted,

                command.RedisInstanceName,

                command.RedisUseSsl,

                command.CacheCoursesEnabled,

                command.CacheArticlesEnabled,

                command.CacheSeminarsEnabled,

                command.CacheBooksEnabled,

                command.CacheSoftwareEnabled,

                command.CacheTeacherAdsEnabled,

                command.CacheFilesEnabled,

                command.CacheCategoriesEnabled,

                command.CacheTeachersEnabled,

                command.CacheProjectsEnabled);

            repository.MarkModified(current);

            await repository.CommitAsync();

            await repository.ForceSetIsEnabledAsync(current.Id, isEnabled);

        }



        await cacheSettingsCache.RefreshAsync();

        // Always wipe stored entries when settings change; especially required when disabling.
        await applicationCacheService.InvalidateAllAsync();

        if (isEnabled)
        {
            try
            {
                // Rebuild InMemory/Redis immediately after wipe (TTL also drives scheduled refresh).
                await cacheWarmupService.StartAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Cache warmup after settings save did not start.");
            }
        }

        logger.LogInformation(

            "Cache settings saved. IsEnabled={IsEnabled} Provider={Provider} TtlMinutes={Ttl}",

            isEnabled,

            provider,

            command.DefaultTtlMinutes);



        var qri = ToQri(current, isEnabled, !string.IsNullOrWhiteSpace(current.RedisPasswordEncrypted));

        return await OkAsync(qri);

    }
    private static CacheSettingsQri ToQri(CacheSettingsEntity row, bool isEnabled, bool hasPassword)
        => new()
        {

            IsEnabled = isEnabled,

            Provider = row.Provider,

            DefaultTtlMinutes = row.DefaultTtlMinutes,

            RedisHost = row.RedisHost,

            RedisPort = row.RedisPort,

            HasRedisPassword = hasPassword,

            RedisInstanceName = row.RedisInstanceName,

            RedisUseSsl = row.RedisUseSsl,

            CacheCoursesEnabled = row.CacheCoursesEnabled,

            CacheArticlesEnabled = row.CacheArticlesEnabled,

            CacheSeminarsEnabled = row.CacheSeminarsEnabled,

            CacheBooksEnabled = row.CacheBooksEnabled,

            CacheSoftwareEnabled = row.CacheSoftwareEnabled,

            CacheTeacherAdsEnabled = row.CacheTeacherAdsEnabled,

            CacheFilesEnabled = row.CacheFilesEnabled,

            CacheCategoriesEnabled = row.CacheCategoriesEnabled,

            CacheTeachersEnabled = row.CacheTeachersEnabled,

            CacheProjectsEnabled = row.CacheProjectsEnabled,

        };

}
