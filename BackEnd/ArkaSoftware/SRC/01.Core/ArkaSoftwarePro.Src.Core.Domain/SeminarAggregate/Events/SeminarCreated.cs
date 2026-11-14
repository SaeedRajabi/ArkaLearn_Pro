using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Events
{
    public record SeminarCreated(string Title, DateTime StartTime, DateTime EndTime, int Capacity, decimal Price, bool IsFree, long? RoomId) : IDomainEvent;
}
