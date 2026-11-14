using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Queries;

public class GetProjectByIdQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IProjectQueriesRepository projectQueriesRepository)
    : QueryHandler<GetProjectByIdQuery, ProjectQri>(mafiaOuterService)
{
    public override async Task<QueryResult<ProjectQri>> Handle(GetProjectByIdQuery query)
    {
        var result = await projectQueriesRepository.GetProjectByIdExecuteAsync(query);
        if (result == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
