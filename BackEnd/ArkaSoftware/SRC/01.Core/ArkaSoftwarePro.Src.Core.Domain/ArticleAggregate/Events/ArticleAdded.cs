using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Events
{
    public record ArticleAdded(long AuthorUserId, string Title, string Slug, long? CategoryId, bool IsPublished) : IDomainEvent;
}
