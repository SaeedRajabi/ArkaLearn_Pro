using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.Redis.Commands.Repositories
{
    public class CategoryCacheCommandRepository(IDistributedCache cache,IConfiguration configuration): ICategoryCacheCommandRepository
    {
        private readonly string _cacheKey = configuration.GetValue("Categories_Cache_Key", ""); // "Categories.List";
        public async Task UpdateCategoryCacheAsync(List<Category> categories)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            var jsonData = JsonSerializer.Serialize(categories);
            await cache.SetStringAsync(_cacheKey, jsonData, options);
        }

        public async Task RemoveCategoryCacheAsync()
        {
            await cache.RemoveAsync(_cacheKey);
        }
    }
}
