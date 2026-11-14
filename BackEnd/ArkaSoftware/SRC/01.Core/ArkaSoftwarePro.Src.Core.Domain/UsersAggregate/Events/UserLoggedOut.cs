using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserLoggedOut(long UserId, DateTime OccurredOn) : IDomainEvent { }
}
