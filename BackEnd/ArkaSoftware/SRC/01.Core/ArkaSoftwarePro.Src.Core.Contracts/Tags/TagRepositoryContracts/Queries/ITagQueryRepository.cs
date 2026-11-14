using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Queries
{
    public interface ITagQueryRepository : IQueryRepository
    {
        Task<TagQri?> GetTagByIdExecuteAsync(GetTagByIdQuery query);
        Task<PagedData<SearchTagQri>?> SearchTagExecuteAsync(SearchTagQuery query);
    }
}
