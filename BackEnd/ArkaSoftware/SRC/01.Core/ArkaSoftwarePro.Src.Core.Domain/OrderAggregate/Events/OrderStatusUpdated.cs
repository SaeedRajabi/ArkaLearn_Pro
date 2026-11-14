using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Events;

public record OrderStatusUpdated(long OrderId , OrderStatus orderStatus) : IDomainEvent { }