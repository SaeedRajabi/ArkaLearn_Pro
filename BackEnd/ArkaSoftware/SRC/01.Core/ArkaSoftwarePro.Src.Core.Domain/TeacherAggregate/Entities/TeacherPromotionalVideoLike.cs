using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherPromotionalVideoLike : Entity
{
    public long VideoId { get; private set; }
    public long UserId { get; private set; }

    private TeacherPromotionalVideoLike() { }

    public static TeacherPromotionalVideoLike Create(long videoId, long userId) =>
        new() { VideoId = videoId, UserId = userId };
}
