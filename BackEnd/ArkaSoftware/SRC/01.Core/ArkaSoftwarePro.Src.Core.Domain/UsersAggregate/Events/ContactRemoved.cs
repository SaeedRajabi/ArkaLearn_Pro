using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record ContactRemoved(long UserId, long ContactId, DateTime OccurredOn) : IDomainEvent { }
}
