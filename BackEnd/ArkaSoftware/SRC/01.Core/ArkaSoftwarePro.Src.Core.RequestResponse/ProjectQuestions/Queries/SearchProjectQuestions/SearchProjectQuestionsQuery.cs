using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;

public class SearchProjectQuestionsQuery : PageQuery<PagedData<SearchProjectQuestionQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public string? Status { get; set; }
    public long? ProjectId { get; set; }
    public long? SubmitterUserId { get; set; }

    public string Path => "/api/Service/ProjectQuestion/Search";
}

public class SearchProjectQuestionQri
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public string? ProjectTitle { get; set; }
    public string? Subject { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AuthorName { get; set; }
    public int AnswerCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
