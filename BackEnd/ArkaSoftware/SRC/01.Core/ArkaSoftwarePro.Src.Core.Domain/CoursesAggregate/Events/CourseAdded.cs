using Framework.Src.Core.Domain.Events;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events
{
    public record CourseAdded(
        string Title,
        CourseStatus Status,
        decimal Price,
        string TitleImage,
        string Description,
        string LongDescription,
        CourseLevel CourseLevel,
        long CategoryId,
        long TeacherId,
        bool IsPublish,
        bool IsCertificate
        ) : IDomainEvent
    { }
}
