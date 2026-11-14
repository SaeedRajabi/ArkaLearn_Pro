using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities
{
    public class FavoriteCourse : AggregateRoot
    {
        public long UserId { get; private set; }
        public long CourseId { get; private set; }
        public DateTime CreatedAt { get; private set; }

        public FavoriteCourse(long userId, long courseId)
        {
            UserId = userId;
            CourseId = courseId;
            CreatedAt = DateTime.UtcNow;
        }

        public FavoriteCourse()
        {
        }
    }
}
