using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Events
{
    public record SeminarCommentApproved(long CommentId, bool IsApproved) : IDomainEvent;
}
