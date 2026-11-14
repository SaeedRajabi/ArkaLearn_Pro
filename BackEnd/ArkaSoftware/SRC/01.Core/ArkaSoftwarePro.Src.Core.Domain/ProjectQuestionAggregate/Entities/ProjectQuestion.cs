using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;

public class ProjectQuestion : AggregateRoot
{
    public long ProjectId { get; private set; }
    public long UserId { get; private set; }
    public string? Subject { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public string? AudioUrl { get; private set; }
    public ProjectQuestionStatus Status { get; private set; }
    public long? ReviewedByUserId { get; private set; }
    public DateTime? ReviewedAt { get; private set; }

    public IReadOnlyList<ProjectAnswer> Answers => _answers;
    private readonly List<ProjectAnswer> _answers = new();

    private ProjectQuestion() { }

    public static ProjectQuestion Submit(
        long projectId,
        long userId,
        string? subject,
        string contentHtml,
        string? audioUrl)
    {
        return new ProjectQuestion
        {
            ProjectId = projectId,
            UserId = userId,
            Subject = string.IsNullOrWhiteSpace(subject) ? null : subject.Trim(),
            ContentHtml = contentHtml ?? string.Empty,
            AudioUrl = audioUrl,
            Status = ProjectQuestionStatus.Pending,
        };
    }

    public ProjectAnswer AddAnswer(long userId, string contentHtml, string? audioUrl)
    {
        var answer = ProjectAnswer.Create(Id, userId, contentHtml, audioUrl);
        _answers.Add(answer);
        return answer;
    }

    public void Review(ProjectQuestionStatus status, long reviewerUserId)
    {
        if (status is not (ProjectQuestionStatus.Approved or ProjectQuestionStatus.Rejected))
            return;

        Status = status;
        ReviewedByUserId = reviewerUserId;
        ReviewedAt = DateTime.UtcNow;
    }
}
