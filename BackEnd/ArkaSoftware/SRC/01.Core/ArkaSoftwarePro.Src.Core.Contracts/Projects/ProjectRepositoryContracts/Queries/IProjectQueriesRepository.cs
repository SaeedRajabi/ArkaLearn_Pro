using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Queries;

public interface IProjectQueriesRepository : IQueryRepository
{
    Task<ProjectQri?> GetProjectByIdExecuteAsync(GetProjectByIdQuery query);
    Task<ProjectQri?> GetProjectBySlugExecuteAsync(GetProjectBySlugQuery query);
    Task<PagedData<SearchProjectQri>?> SearchProjectExecuteAsync(SearchProjectByInputValueQuery query);
}
