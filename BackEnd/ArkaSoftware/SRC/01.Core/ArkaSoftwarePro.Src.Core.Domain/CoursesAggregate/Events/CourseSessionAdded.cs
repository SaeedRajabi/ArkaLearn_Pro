using Framework.Src.Core.Domain.Events;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events
{
    public record CourseSessionAdded(string Title, List<CourseLesson> courseLessons) : IDomainEvent
    {
    }
}
