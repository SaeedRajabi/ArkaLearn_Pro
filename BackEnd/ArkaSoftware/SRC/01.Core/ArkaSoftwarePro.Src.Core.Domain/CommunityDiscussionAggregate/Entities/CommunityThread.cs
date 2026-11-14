using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;

public class CommunityThread : AggregateRoot
{
    public long UserId { get; private set; }
    public string? Subject { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public string? AudioUrl { get; private set; }
    public string? Slug { get; private set; }
    public int ReplyCount { get; private set; }
    public int LikeCount { get; private set; }
    public int DislikeCount { get; private set; }

    public IReadOnlyList<CommunityReply> Replies => _replies;
    private readonly List<CommunityReply> _replies = new();

    private CommunityThread() { }

    public static CommunityThread Create(
        long userId,
        string? subject,
        string contentHtml,
        string? audioUrl,
        string? slug = null)
    {
        return new CommunityThread
        {
            UserId = userId,
            Subject = string.IsNullOrWhiteSpace(subject) ? null : subject.Trim(),
            ContentHtml = contentHtml ?? string.Empty,
            AudioUrl = audioUrl,
            Slug = string.IsNullOrWhiteSpace(slug) ? null : slug.Trim(),
            ReplyCount = 0,
            LikeCount = 0,
            DislikeCount = 0,
        };
    }

    public CommunityReply AddReply(long userId, string contentHtml, string? audioUrl)
    {
        var reply = CommunityReply.Create(Id, userId, contentHtml, audioUrl);
        _replies.Add(reply);
        ReplyCount++;
        return reply;
    }

    public void IncrementLike() => LikeCount++;
    public void DecrementLike() => LikeCount = Math.Max(0, LikeCount - 1);
    public void IncrementDislike() => DislikeCount++;
    public void DecrementDislike() => DislikeCount = Math.Max(0, DislikeCount - 1);
}
