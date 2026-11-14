using Framework.Src.Core.Domain.Events;

namespace Framework.Src.Core.Contracts.ApplicationService.Events
{
    public interface IDomainEventHandler<TDomainEvent> where TDomainEvent : IDomainEvent
    {
        Task Handle(TDomainEvent Event);
    }
}
