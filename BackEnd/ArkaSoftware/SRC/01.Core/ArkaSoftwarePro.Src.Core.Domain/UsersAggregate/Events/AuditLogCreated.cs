using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record AuditLogCreated(long UserId, ActionType Action, DateTime Time, string IPAddress, string DeviceInfo) : IDomainEvent { }
}
