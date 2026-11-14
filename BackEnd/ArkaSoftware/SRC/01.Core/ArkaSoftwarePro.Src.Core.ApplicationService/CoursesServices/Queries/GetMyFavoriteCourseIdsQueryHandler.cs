using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourseIds;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Queries
{
    public class GetMyFavoriteCourseIdsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICourseQueriesRepository courseQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyFavoriteCourseIdsQuery, List<long>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<long>>> Handle(GetMyFavoriteCourseIdsQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<long>(), ApplicationServiceStatus.NotFound);

            var result = await courseQueriesRepository.GetMyFavoriteCourseIdsAsync(new GetMyFavoriteCourseIdsQuery { UserId = userId });
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
