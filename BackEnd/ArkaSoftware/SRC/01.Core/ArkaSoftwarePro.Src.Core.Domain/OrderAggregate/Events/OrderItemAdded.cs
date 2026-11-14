using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Events;

public record OrderItemAdded(long CourseId , decimal UnitPrice , int Quantity) : IDomainEvent { }