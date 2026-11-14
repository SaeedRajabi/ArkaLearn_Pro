using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events;

public record RoomUserStatusUpdated(long RoomUserId, bool Status) : IDomainEvent { }