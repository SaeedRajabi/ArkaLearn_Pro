using Framework.Src.Core.Domain.Events;

namespace Framework.Src.Core.Domain.Aggregates
{
    public interface IAggregateRoot
    {
        void ClearEvents();
        IEnumerable<IDomainEvent> GetEvents();
    }
}
