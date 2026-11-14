using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Events;

public record CategoryImageChanged(string CategoryImageUrl) : IDomainEvent
{
}