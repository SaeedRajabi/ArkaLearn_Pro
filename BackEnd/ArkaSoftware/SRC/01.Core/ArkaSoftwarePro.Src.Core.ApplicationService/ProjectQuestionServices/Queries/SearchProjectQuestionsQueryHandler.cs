using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectQuestionServices.Queries;

public class SearchProjectQuestionsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectQuestionQueriesRepository repository)
    : QueryHandler<SearchProjectQuestionsQuery, PagedData<SearchProjectQuestionQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchProjectQuestionQri>>> Handle(SearchProjectQuestionsQuery query)
    {
        var result = await repository.SearchAsync(query);
        return await ResultAsync(result ?? new PagedData<SearchProjectQuestionQri>(), ApplicationServiceStatus.Ok);
    }
}
