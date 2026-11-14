using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Queries;

public class SearchProjectQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IProjectQueriesRepository projectQueriesRepository)
    : QueryHandler<SearchProjectByInputValueQuery, PagedData<SearchProjectQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<PagedData<SearchProjectQri>>> Handle(SearchProjectByInputValueQuery query)
    {
        var result = await projectQueriesRepository.SearchProjectExecuteAsync(query);
        return await ResultAsync(result ?? new PagedData<SearchProjectQri>(), ApplicationServiceStatus.Ok);
    }
}
