using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticleIds;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries
{
    public class GetMyFavoriteArticleIdsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IArticleQueriesRepository articleQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyFavoriteArticleIdsQuery, List<long>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<long>>> Handle(GetMyFavoriteArticleIdsQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<long>(), ApplicationServiceStatus.NotFound);

            var result = await articleQueriesRepository.GetMyFavoriteArticleIdsAsync(new GetMyFavoriteArticleIdsQuery { UserId = userId });
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
