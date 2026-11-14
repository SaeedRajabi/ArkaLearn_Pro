using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class GetMyRegisteredSeminarsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarQueriesRepository seminarQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyRegisteredSeminarsQuery, List<MyRegisteredSeminarQri>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<MyRegisteredSeminarQri>>> Handle(GetMyRegisteredSeminarsQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<MyRegisteredSeminarQri>(), ApplicationServiceStatus.NotFound);

            query.UserId = userId;
            var result = await seminarQueriesRepository.GetMyRegisteredSeminarsAsync(query);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
