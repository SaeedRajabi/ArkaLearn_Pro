using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;

public class GetProjectQuestionsByProjectIdQuery : IQuery<List<ProjectQuestionQri>>, IWebRequest
{
    public long ProjectId { get; set; }
    public long? CurrentUserId { get; set; }

    public string Path => "/api/Service/ProjectQuestion/GetByProjectId";
}

public class ProjectQuestionQri
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long UserId { get; set; }
    public string? Subject { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public List<ProjectAnswerQri> Answers { get; set; } = new();
}

public class ProjectAnswerQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int LikeCount { get; set; }
    public bool LikedByCurrentUser { get; set; }
    public bool IsBestAnswer { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
