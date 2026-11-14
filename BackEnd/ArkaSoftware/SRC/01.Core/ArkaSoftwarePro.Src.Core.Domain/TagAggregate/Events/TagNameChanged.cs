using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Events
{
    public record TagNameChanged(string TagName) : IDomainEvent { }
}
