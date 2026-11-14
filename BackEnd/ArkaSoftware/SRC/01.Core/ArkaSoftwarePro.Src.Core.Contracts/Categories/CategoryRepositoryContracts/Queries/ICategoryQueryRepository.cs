using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries
{
    public interface ICategoryQueryRepository : IQueryRepository
    {
        Task<CategoryQri> GetCategoryByIdExecuteAsync(GetCategoryByIdQuery query);
        Task<PagedData<SearchCategoryQri>?> SearchCategoryExecuteAsync(SearchCategoryQuery query);
        Task<bool> IsDescendantOfAsync(long ancestorId, long possibleDescendantId);
    }
}
