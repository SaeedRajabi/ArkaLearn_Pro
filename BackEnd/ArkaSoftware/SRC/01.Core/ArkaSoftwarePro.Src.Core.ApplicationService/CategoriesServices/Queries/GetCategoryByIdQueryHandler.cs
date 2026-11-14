using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Queries
{
    public class GetCategoryByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ICategoryQueryRepository categoryQueryRepository)
        : QueryHandler<GetCategoryByIdQuery, CategoryQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<CategoryQri>> Handle(GetCategoryByIdQuery query)
        {
            var categoryByIdExecuteAsync = await categoryQueryRepository.GetCategoryByIdExecuteAsync(query);
            if (categoryByIdExecuteAsync! == null!)
                return await ResultAsync(null!, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
            return await ResultAsync(categoryByIdExecuteAsync, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
