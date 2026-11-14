using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events
{
    public record LoginIntoRoom(string UserName, string Password) : IDomainEvent { }
}
