using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events
{
    public record CourseAdded(long CourseId) : IDomainEvent { }
}
