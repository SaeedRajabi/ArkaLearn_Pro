using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class TagQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ITagQueryRepository
    {
        async Task<TagQri?> ITagQueryRepository.GetTagByIdExecuteAsync(GetTagByIdQuery query) =>
            await _dbContext.Tags.AsNoTracking()
            .Select(x => new TagQri()
            {
                TagId = x.Id,
                TagName = x.TagName
            }).FirstOrDefaultAsync(x => x.TagId == query.TagId);

        async Task<PagedData<SearchTagQri>?> ITagQueryRepository.SearchTagExecuteAsync(SearchTagQuery query)
        {
            PagedData<SearchTagQri> result = new();
            var queryResult = _dbContext.Tags
                 .AsNoTracking()
                 .Where(x => string.IsNullOrEmpty(query.TagName) || x.TagName.ToLower().Contains(query.TagName.ToLower()))
                 .OrderBy(x => x.TagName);
            if (query.NeedTotalCount)
            {
                result.TotalCount = queryResult.Count();
            }

            result.QueryResult = await queryResult
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchTagQri
                {
                    TagName = x.TagName,

                }).ToListAsync();
            return result!;
        }
    }
}
