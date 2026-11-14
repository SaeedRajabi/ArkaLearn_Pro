using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events;

public record CourseVideoAdded(
    string Title,
    string VideoPath,
    TimeSpan Duration
) : IDomainEvent
{ }