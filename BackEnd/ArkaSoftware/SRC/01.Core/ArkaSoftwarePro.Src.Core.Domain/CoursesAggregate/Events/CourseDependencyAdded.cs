using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events
{
    public record CourseDependencyAdded(long UserId, string DependencyTitle) : IDomainEvent
    {
    }
}
