using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Events
{
    public record ArticleCommentApproved(long CommentId, bool IsApproved) : IDomainEvent;
}
