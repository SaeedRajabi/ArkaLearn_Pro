using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Queries
{
    public class SearchSeminarQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        ISeminarQueriesRepository seminarQueriesRepository)
        : QueryHandler<SearchSeminarByInputValueQuery, PagedData<SearchSeminarQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<PagedData<SearchSeminarQri>>> Handle(SearchSeminarByInputValueQuery query)
        {
            var result = await seminarQueriesRepository.SearchSeminarExecuteAsync(query);
            if (result == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
    }
}
