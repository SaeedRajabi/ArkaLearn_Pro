using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Endpoints.API.CustomDecorators;

public class CustomQueryDecorator(IApplicationCacheService cacheService) : QueryDispatcherDecorator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public override int Order => 0;

    public override async Task<QueryResult<TData>> Execute<TQuery, TData>(TQuery query)
    {
        var attribute = typeof(TQuery).GetCustomAttribute<CacheableQueryAttribute>();
        if (attribute is null)
            return await _queryDispatcher.Execute<TQuery, TData>(query);

        // Edit/admin listings often depend on HttpContext; never share those with public cache keys.
        var forEditProp = typeof(TQuery).GetProperty("ForEdit");
        if (forEditProp?.PropertyType == typeof(bool) && forEditProp.GetValue(query) is true)
            return await _queryDispatcher.Execute<TQuery, TData>(query);

        var key = BuildQueryKey(query);
        try
        {
            var cached = await cacheService.GetAsync<CachedQueryEnvelope<TData>>(attribute.Region, key);
            if (cached is not null && cached.Status == ApplicationServiceStatus.Ok)
            {
                var hit = new QueryResult<TData> { Status = cached.Status };
                hit._data = cached.Data;
                return hit;
            }
        }
        catch
        {
            // Redis/memory cache failures must not break reads.
        }

        var result = await _queryDispatcher.Execute<TQuery, TData>(query);
        if (result.Status == ApplicationServiceStatus.Ok && result.Data is not null)
        {
            try
            {
                await cacheService.SetAsync(attribute.Region, key, new CachedQueryEnvelope<TData>
                {
                    Data = result.Data,
                    Status = result.Status,
                });
            }
            catch
            {
                // best effort
            }
        }

        return result;
    }

    private static string BuildQueryKey<TQuery>(TQuery query)
    {
        var json = JsonSerializer.Serialize(query, JsonOptions);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)))[..24];
        return $"{typeof(TQuery).Name}:{hash}";
    }

    private sealed class CachedQueryEnvelope<TData>
    {
        public TData? Data { get; set; }
        public ApplicationServiceStatus Status { get; set; }
    }
}
