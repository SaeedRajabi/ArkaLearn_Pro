using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionsByProjectId;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.GetProjectQuestionById;

public class GetProjectQuestionByIdQuery : IQuery<ProjectQuestionDetailQri>, IWebRequest
{
    public long QuestionId { get; set; }

    public string Path => "/api/Service/ProjectQuestion/GetById";
}

public class ProjectQuestionDetailQri : ProjectQuestionQri
{
    public string? ProjectTitle { get; set; }
    public string? AuthorEmail { get; set; }
    public string? ReviewedByName { get; set; }
    public string? ReviewedAt { get; set; }
}
