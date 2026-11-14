using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Queries;

public class GetProjectQuestionsByProjectIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionQueriesRepository repository)
    : QueryHandler<GetProjectQuestionsByProjectIdQuery, List<ProjectQuestionQri>>(outer)
{
    public override async Task<QueryResult<List<ProjectQuestionQri>>> Handle(GetProjectQuestionsByProjectIdQuery query)
    {
        var items = await repository.GetByProjectIdAsync(query);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
