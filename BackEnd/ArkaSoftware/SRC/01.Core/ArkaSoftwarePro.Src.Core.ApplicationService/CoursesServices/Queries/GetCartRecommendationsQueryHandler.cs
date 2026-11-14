using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCartRecommendations;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries;

public class GetCartRecommendationsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseQueriesRepository courseQueriesRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetCartRecommendationsQuery, CartRecommendationsQri>(outer)
{
    public override async Task<QueryResult<CartRecommendationsQri>> Handle(GetCartRecommendationsQuery query)
    {
        long? userId = null;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        if (long.TryParse(claim, out var parsed) && parsed > 0)
            userId = parsed;

        var data = await courseQueriesRepository.GetCartRecommendationsAsync(
            query.CourseIds ?? [],
            userId,
            CancellationToken.None);

        return await ResultAsync(data, ApplicationServiceStatus.Ok);
    }
}
