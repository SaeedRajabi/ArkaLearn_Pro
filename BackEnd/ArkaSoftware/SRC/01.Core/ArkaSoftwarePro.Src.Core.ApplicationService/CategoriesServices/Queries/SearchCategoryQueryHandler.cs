using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Queries
{
    public class SearchCategoryQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ICategoryQueryRepository categoryQueryRepository)
        : QueryHandler<SearchCategoryQuery, PagedData<SearchCategoryQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<SearchCategoryQri>>> Handle(SearchCategoryQuery query)
        {
            var categoryExecuteAsync = await categoryQueryRepository.SearchCategoryExecuteAsync(query);
            if (categoryExecuteAsync == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(categoryExecuteAsync, ApplicationServiceStatus.Ok);
        }
    }
}
