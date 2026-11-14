using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ProjectQuestions;

public class ProjectQuestionQueryModel
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public long UserId { get; set; }
    public string? Subject { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public ProjectQuestionStatus Status { get; set; }
    public long? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }

    public UserQueryModel? User { get; set; }
    public UserQueryModel? ReviewedByUser { get; set; }
    public List<ProjectAnswerQueryModel> Answers { get; set; } = new();
}

public class ProjectAnswerQueryModel
{
    public long Id { get; set; }
    public long QuestionId { get; set; }
    public long UserId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int LikeCount { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }

    public UserQueryModel? User { get; set; }
}

public class ProjectAnswerLikeQueryModel
{
    public long Id { get; set; }
    public long AnswerId { get; set; }
    public long UserId { get; set; }
    public bool IsDelete { get; set; }
}
