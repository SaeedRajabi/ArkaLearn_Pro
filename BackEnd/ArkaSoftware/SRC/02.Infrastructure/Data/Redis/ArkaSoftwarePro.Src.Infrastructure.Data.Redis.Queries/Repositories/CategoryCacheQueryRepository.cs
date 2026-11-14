using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;
using Framework.Src.Core.RequestResponse.Queries;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.Redis.Queries.Repositories
{
    public class CategoryCacheQueryRepository(IDistributedCache cache, IConfiguration configuration)
        :ICategoryCacheQueryRepository
    {
        private readonly string _cacheKey = configuration.GetValue("Cache_Keys:Categories_Cache_Key", "");


        public async Task<PagedData<SearchCategoryQri>> SearchCategoryCacheAsync(SearchCategoryQuery query)
        {
            var result = new PagedData<SearchCategoryQri>();

            var cacheData = await cache.GetStringAsync(_cacheKey);

            if (string.IsNullOrEmpty(cacheData))
                return result;

            var allCategories = JsonSerializer.Deserialize<List<SearchCategoryQri>>(cacheData) ?? new List<SearchCategoryQri>();

            // 1. Search
            if (!string.IsNullOrWhiteSpace(query.CategoryName))
            {
                var keyword = query.CategoryName.Trim().ToLower();
                allCategories = allCategories.Where(c =>
                    (c.Name?.ToLower().Contains(keyword) ?? false)
                ).ToList();
            }

            // 2. Sort
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                allCategories = query.SortBy.ToLower() switch
                {
                    "CategoryName" => query.SortAscending ? allCategories.OrderBy(c => c.Name).ToList() : allCategories.OrderByDescending(c => c.Name).ToList(),
                    //"CreateAt" => query.SortAscending ? allCategories.OrderBy(c => c.CreateDate).ToList() : allCategories.OrderByDescending(c => c.CreateDate).ToList(),
                    _ => allCategories
                };
            }

            // 3. Pagination
            result.TotalCount = allCategories.Count;
            result.QueryResult = allCategories
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToList();

            return result;
        }

        public Task<PagedData<GetAllMessageWithRoomIdQri>> SearchCategoryCacheAsync(GetAllMessageWithRoomIdQuery query)
        {
            throw new NotImplementedException();
        }
    }
}
