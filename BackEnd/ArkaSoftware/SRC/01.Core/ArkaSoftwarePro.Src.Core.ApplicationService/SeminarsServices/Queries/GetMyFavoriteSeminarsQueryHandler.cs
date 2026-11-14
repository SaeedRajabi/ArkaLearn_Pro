using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class GetMyFavoriteSeminarsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarQueriesRepository seminarQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyFavoriteSeminarsQuery, List<GetMyFavoriteSeminarQri>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<GetMyFavoriteSeminarQri>>> Handle(GetMyFavoriteSeminarsQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<GetMyFavoriteSeminarQri>(), ApplicationServiceStatus.NotFound);

            var result = await seminarQueriesRepository.GetMyFavoriteSeminarsAsync(new GetMyFavoriteSeminarsQuery { UserId = userId });
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
