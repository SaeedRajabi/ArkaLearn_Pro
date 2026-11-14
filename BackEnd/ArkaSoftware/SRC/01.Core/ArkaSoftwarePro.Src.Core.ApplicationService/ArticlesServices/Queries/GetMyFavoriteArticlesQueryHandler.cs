using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries
{
    public class GetMyFavoriteArticlesQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleQueriesRepository articleQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyFavoriteArticlesQuery, List<GetMyFavoriteArticleQri>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<GetMyFavoriteArticleQri>>> Handle(GetMyFavoriteArticlesQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<GetMyFavoriteArticleQri>(), ApplicationServiceStatus.NotFound);

            var result = await articleQueriesRepository.GetMyFavoriteArticlesAsync(new GetMyFavoriteArticlesQuery { UserId = userId });
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
