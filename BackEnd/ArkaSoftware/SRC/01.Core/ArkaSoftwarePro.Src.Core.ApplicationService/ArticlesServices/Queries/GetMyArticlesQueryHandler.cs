using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyArticles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ArticlesServices.Queries;

public class GetMyArticlesQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IArticleQueriesRepository articleQueriesRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyArticlesQuery, PagedData<SearchArticleQri>>(mafiaOuterServices)
{
    public override async Task<QueryResult<PagedData<SearchArticleQri>>> Handle(GetMyArticlesQuery query)
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
                          ?? httpContextAccessor.HttpContext?.User?.FindFirst("nameid")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId) || userId <= 0)
            return await ResultAsync(new PagedData<SearchArticleQri>(), ApplicationServiceStatus.NotFound);

        var searchQuery = new SearchArticleByInputValueQuery
        {
            InputValue = query.InputValue ?? string.Empty,
            PublishedOnly = false,
            AuthorUserId = userId,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            NeedTotalCount = query.NeedTotalCount,
        };

        var result = await articleQueriesRepository.SearchArticleExecuteAsync(searchQuery);
        if (result == null)
            return await ResultAsync(new PagedData<SearchArticleQri>(), ApplicationServiceStatus.Ok);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
