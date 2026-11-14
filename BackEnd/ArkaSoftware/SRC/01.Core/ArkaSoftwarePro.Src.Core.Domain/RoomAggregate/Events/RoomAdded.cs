using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events
{
    public record RoomAdded(string Title, int Capacity, string BaseURlLink,
            bool IsGuest, int GuestQuantity, bool FirstAdminInput, bool TeacherEntersFirst,
            int MaxSessionTime, long UserId , StatusType Status) : IDomainEvent { }
}
