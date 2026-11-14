using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;

public class CommunityReply : Entity
{
    public long ThreadId { get; private set; }
    public long UserId { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public string? AudioUrl { get; private set; }
    public int LikeCount { get; private set; }

    private CommunityReply() { }

    public static CommunityReply Create(long threadId, long userId, string contentHtml, string? audioUrl)
    {
        return new CommunityReply
        {
            ThreadId = threadId,
            UserId = userId,
            ContentHtml = contentHtml ?? string.Empty,
            AudioUrl = audioUrl,
            LikeCount = 0,
        };
    }

    public void IncrementLike() => LikeCount++;
    public void DecrementLike() => LikeCount = Math.Max(0, LikeCount - 1);
}
