using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class GetSeminarByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ISeminarQueriesRepository seminarQueriesRepository)
        : QueryHandler<GetSeminarByIdQuery, SeminarQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<SeminarQri>> Handle(GetSeminarByIdQuery query)
        {
            var result = await seminarQueriesRepository.GetSeminarByIdExecuteAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
