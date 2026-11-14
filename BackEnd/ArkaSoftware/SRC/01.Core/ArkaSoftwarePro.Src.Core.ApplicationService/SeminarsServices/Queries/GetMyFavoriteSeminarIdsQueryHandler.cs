using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminarIds;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class GetMyFavoriteSeminarIdsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarQueriesRepository seminarQueriesRepository,
        IHttpContextAccessor httpContextAccessor)
        : QueryHandler<GetMyFavoriteSeminarIdsQuery, List<long>>(mafiaOuterServices)
    {
        public override async Task<QueryResult<List<long>>> Handle(GetMyFavoriteSeminarIdsQuery query)
        {
            var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return await ResultAsync(new List<long>(), ApplicationServiceStatus.NotFound);

            var result = await seminarQueriesRepository.GetMyFavoriteSeminarIdsAsync(new GetMyFavoriteSeminarIdsQuery { UserId = userId });
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
