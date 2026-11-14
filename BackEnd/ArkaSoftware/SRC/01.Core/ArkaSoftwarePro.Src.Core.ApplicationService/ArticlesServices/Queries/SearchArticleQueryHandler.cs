using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries
{
    public class SearchArticleQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IArticleQueriesRepository articleQueriesRepository)
        : QueryHandler<SearchArticleByInputValueQuery, PagedData<SearchArticleQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<SearchArticleQri>>> Handle(SearchArticleByInputValueQuery query)
        {
            var result = await articleQueriesRepository.SearchArticleExecuteAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
