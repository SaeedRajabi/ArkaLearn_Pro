using Framework.Src.Core.Domain.Events;

namespace Framework.Src.Core.Contracts.ApplicationService.Events
{
    public interface IDomainEventDispatcher
    {
        Task PublishDomainEventAsync<TDomainEvent>(TDomainEvent @event) where TDomainEvent : class, IDomainEvent;
    }
}
