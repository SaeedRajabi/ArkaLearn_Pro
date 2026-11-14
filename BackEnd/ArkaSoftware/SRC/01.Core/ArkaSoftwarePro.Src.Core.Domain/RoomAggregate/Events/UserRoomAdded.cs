using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events
{
    public record UserRoomAdded(string FirstName , string LastName , string UserName , string Password , long RoomId):IDomainEvent { }
}
