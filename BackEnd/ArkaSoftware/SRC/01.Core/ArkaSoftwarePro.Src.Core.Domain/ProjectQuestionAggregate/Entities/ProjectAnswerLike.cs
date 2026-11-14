using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;

public class ProjectAnswerLike : Entity
{
    public long AnswerId { get; private set; }
    public long UserId { get; private set; }

    private ProjectAnswerLike() { }

    public static ProjectAnswerLike Create(long answerId, long userId) =>
        new() { AnswerId = answerId, UserId = userId };
}
