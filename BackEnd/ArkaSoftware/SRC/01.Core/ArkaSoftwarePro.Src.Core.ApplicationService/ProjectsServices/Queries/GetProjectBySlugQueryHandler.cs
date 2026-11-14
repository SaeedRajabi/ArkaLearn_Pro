using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Queries;

public class GetProjectBySlugQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IProjectQueriesRepository projectQueriesRepository)
    : QueryHandler<GetProjectBySlugQuery, ProjectQri>(mafiaOuterService)
{
    public override async Task<QueryResult<ProjectQri>> Handle(GetProjectBySlugQuery query)
    {
        var result = await projectQueriesRepository.GetProjectBySlugExecuteAsync(query);
        if (result == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
