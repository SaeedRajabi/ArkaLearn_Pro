using Framework.Src.Core.Domain.Events;

namespace Framework.Src.Core.Contracts.Data.Commands
{
    /// <summary>
    /// ها از این اینترفیس استفاده میشود event در صورت نیاز به ذخیره و بازیابی
    /// </summary>
    public interface IDomainEventStore
    {
        void Save<TEvent>(string aggregateName, string aggregateId, IEnumerable<TEvent> events) where TEvent : IDomainEvent;
        Task SaveAsync<TEvent>(string aggregateName, string aggregateId, IEnumerable<TEvent> events) where TEvent : IDomainEvent;
    }
}
