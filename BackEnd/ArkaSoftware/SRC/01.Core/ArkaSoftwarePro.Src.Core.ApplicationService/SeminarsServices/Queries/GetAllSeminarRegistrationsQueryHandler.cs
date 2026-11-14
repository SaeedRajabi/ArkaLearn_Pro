using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class GetAllSeminarRegistrationsQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ISeminarQueriesRepository seminarQueriesRepository)
        : QueryHandler<GetAllSeminarRegistrationsQuery, PagedData<SeminarRegistrationWithSeminarQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<SeminarRegistrationWithSeminarQri>>> Handle(GetAllSeminarRegistrationsQuery query)
        {
            var result = await seminarQueriesRepository.GetAllSeminarRegistrationsAsync(query);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
