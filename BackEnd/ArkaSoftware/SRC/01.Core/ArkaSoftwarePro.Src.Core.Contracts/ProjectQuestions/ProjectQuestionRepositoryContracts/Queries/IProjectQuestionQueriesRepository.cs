using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions.ProjectQuestionRepositoryContracts.Queries;

public interface IProjectQuestionQueriesRepository : IQueryRepository
{
    Task<List<ProjectQuestionQri>> GetByProjectIdAsync(GetProjectQuestionsByProjectIdQuery query);
    Task<ProjectQuestionDetailQri?> GetByIdAsync(GetProjectQuestionByIdQuery query);
    Task<PagedData<SearchProjectQuestionQri>?> SearchAsync(SearchProjectQuestionsQuery query);
    Task<int> GetPendingCountAsync();
}
