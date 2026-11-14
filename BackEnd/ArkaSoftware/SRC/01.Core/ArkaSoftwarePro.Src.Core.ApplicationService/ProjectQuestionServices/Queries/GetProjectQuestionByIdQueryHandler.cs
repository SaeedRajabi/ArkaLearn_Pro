using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Queries;

public class GetProjectQuestionByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionQueriesRepository repository)
    : QueryHandler<GetProjectQuestionByIdQuery, ProjectQuestionDetailQri>(outer)
{
    public override async Task<QueryResult<ProjectQuestionDetailQri>> Handle(GetProjectQuestionByIdQuery query)
    {
        var item = await repository.GetByIdAsync(query);
        if (item == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(item, ApplicationServiceStatus.Ok);
    }
}
