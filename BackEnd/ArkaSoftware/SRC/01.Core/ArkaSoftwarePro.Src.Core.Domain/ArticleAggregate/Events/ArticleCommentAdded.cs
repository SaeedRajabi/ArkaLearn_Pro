using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Events
{
    public record ArticleCommentAdded(long UserId, string Content, int Rating, int Like, long? ParentId) : IDomainEvent;
}
