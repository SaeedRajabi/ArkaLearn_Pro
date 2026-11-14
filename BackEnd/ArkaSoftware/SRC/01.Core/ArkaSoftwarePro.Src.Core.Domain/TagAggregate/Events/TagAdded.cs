using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Events
{
    public record TagAdded(string TagName) : IDomainEvent { }
}
