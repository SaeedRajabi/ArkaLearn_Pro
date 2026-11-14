using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherPromotionalVideoComment : Entity
{
    public long VideoId { get; private set; }
    public long UserId { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public long? ParentId { get; private set; }

    private TeacherPromotionalVideoComment() { }

    public static TeacherPromotionalVideoComment Create(long videoId, long userId, string content, long? parentId = null) =>
        new()
        {
            VideoId = videoId,
            UserId = userId,
            Content = content.Trim(),
            ParentId = parentId is > 0 ? parentId : null,
        };
}
