using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events;

public record CourseTitleImageChanged(long CourseId, string NewImageUrl) : IDomainEvent { }