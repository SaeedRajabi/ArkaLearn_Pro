using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries
{
    public class GetAllCommentsByArticleIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IArticleQueriesRepository articleQueriesRepository)
        : QueryHandler<GetAllCommentsByArticleIdQuery, PagedData<GetAllCommentsByArticleIdQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<GetAllCommentsByArticleIdQri>>> Handle(GetAllCommentsByArticleIdQuery query)
        {
            var result = await articleQueriesRepository.GetAllArticleCommentsByIdAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
