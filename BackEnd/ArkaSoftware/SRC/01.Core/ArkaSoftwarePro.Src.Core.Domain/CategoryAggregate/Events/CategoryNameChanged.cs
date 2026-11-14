using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Events
{
    public record CategoryNameChanged(string CategoryName) : IDomainEvent
    {
    }
}
