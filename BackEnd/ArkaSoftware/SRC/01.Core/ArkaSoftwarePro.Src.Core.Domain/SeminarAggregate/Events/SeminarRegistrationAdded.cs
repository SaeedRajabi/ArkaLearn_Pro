using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Events
{
    public record SeminarRegistrationAdded(long UserId, long SeminarId, bool HasPaid) : IDomainEvent;
}
