using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;

public class ProjectAnswer : Entity
{
    public long QuestionId { get; private set; }
    public long UserId { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public string? AudioUrl { get; private set; }
    public int LikeCount { get; private set; }

    private ProjectAnswer() { }

    public static ProjectAnswer Create(long questionId, long userId, string contentHtml, string? audioUrl)
    {
        return new ProjectAnswer
        {
            QuestionId = questionId,
            UserId = userId,
            ContentHtml = contentHtml ?? string.Empty,
            AudioUrl = audioUrl,
            LikeCount = 0,
        };
    }

    public void IncrementLike() => LikeCount++;
    public void DecrementLike() => LikeCount = Math.Max(0, LikeCount - 1);
}
