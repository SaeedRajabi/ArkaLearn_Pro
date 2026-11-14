using Framework.Src.Core.Contracts.ApplicationService.Events;
using Framework.Src.Core.Domain.Events;

namespace Framework.Src.Core.ApplicationService.Events
{
    public abstract class EventDispatcherDecorator : IDomainEventDispatcher
    {
        #region Fields
        protected IDomainEventDispatcher _eventDispatcher;
        public abstract int Order { get; }
        #endregion

        #region Constructors
        public EventDispatcherDecorator() { }
        #endregion

        #region Abstract Send Commands
        public abstract Task PublishDomainEventAsync<TDomainEvent>(TDomainEvent @event) where TDomainEvent : class, IDomainEvent;

        public void SetEventDispatcher(IDomainEventDispatcher eventDispatcher)
        {
            _eventDispatcher = eventDispatcher;
        }
        #endregion
    }


}
