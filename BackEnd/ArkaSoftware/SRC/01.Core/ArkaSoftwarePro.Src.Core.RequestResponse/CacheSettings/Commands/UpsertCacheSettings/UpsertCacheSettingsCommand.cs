using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Endpoints;

using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;



namespace ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Commands.UpsertCacheSettings;



public class UpsertCacheSettingsCommand : ICommand<CacheSettingsQri>, IWebRequest

{

    /// <summary>Nullable so missing JSON is detected (do not default to true).</summary>

    public bool? IsEnabled { get; set; }



    public string Provider { get; set; } = "InMemory";

    public int DefaultTtlMinutes { get; set; } = 30;

    public string RedisHost { get; set; } = "127.0.0.1";

    public int RedisPort { get; set; } = 6379;

    public string? RedisPassword { get; set; }

    public string RedisInstanceName { get; set; } = "ArkaLearn:";

    public bool RedisUseSsl { get; set; }

    public bool CacheCoursesEnabled { get; set; } = true;

    public bool CacheArticlesEnabled { get; set; } = true;

    public bool CacheSeminarsEnabled { get; set; } = true;

    public bool CacheBooksEnabled { get; set; } = true;

    public bool CacheSoftwareEnabled { get; set; } = true;

    public bool CacheTeacherAdsEnabled { get; set; } = true;

    public bool CacheFilesEnabled { get; set; } = true;

    public bool CacheCategoriesEnabled { get; set; } = true;

    public bool CacheTeachersEnabled { get; set; } = true;

    public bool CacheProjectsEnabled { get; set; } = true;

    public string Path => "/api/Service/CacheSettings/Upsert";

}


