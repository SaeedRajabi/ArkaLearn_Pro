using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Events;

public record StudentAddedToOrder(long OrderId , long StudentId) : IDomainEvent { }