using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

public class SupportTeacherStoryView : Entity
{
    public long StoryId { get; private set; }
    public long ViewerUserId { get; private set; }
    public DateTime ViewedAtUtc { get; private set; }

    private SupportTeacherStoryView() { }

    public static SupportTeacherStoryView Create(long storyId, long viewerUserId)
    {
        return new SupportTeacherStoryView
        {
            StoryId = storyId,
            ViewerUserId = viewerUserId,
            ViewedAtUtc = DateTime.UtcNow,
        };
    }
}
