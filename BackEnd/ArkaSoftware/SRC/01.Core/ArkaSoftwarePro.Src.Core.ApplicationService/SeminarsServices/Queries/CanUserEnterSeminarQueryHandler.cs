using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.CanUserEnterSeminar;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class CanUserEnterSeminarQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ISeminarQueriesRepository seminarQueriesRepository)
        : QueryHandler<CanUserEnterSeminarQuery, CanUserEnterSeminarQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<CanUserEnterSeminarQri>> Handle(CanUserEnterSeminarQuery query)
        {
            var result = await seminarQueriesRepository.CanUserEnterSeminarAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
