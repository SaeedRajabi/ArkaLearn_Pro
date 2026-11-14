using Framework.Src.Core.Domain.Events;


namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserSessionAdded(long userId, DateTime ExpireAt, string IpAddress, string DeviceInfo) : IDomainEvent
    {
    }
}
