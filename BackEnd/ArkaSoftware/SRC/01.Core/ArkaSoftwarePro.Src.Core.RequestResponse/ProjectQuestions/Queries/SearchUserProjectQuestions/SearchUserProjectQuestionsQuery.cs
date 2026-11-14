using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchUserProjectQuestions;

public class SearchUserProjectQuestionsQuery : PageQuery<PagedData<SearchProjectQuestionQri>>, IWebRequest
{
    public long UserId { get; set; }

    public string Path => "/api/Service/Student/SearchUserProjectQuestions";
}
