using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Events
{
    public record SeminarCommentAdded(long UserId, string Content, int Rating, int Like, long? ParentId) : IDomainEvent;
}
