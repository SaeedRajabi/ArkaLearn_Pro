using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events
{
    public record CourseCommentAdded(long UserId, string Content,int Rate , int Like , long? ParentId) : IDomainEvent
    {
    }
}
