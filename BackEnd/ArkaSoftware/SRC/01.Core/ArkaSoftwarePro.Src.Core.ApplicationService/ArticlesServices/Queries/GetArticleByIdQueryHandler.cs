using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries
{
    public class GetArticleByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IArticleQueriesRepository articleQueriesRepository)
        : QueryHandler<GetArticleByIdQuery, ArticleQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<ArticleQri>> Handle(GetArticleByIdQuery query)
        {
            var result = await articleQueriesRepository.GetArticleByIdExecuteAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
