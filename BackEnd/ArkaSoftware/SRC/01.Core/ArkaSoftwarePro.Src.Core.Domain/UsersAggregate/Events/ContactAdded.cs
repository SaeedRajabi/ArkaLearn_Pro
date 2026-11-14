using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record ContactAdded(long UserId, long ContactId, DateTime OccurredOn) : IDomainEvent { }
}
