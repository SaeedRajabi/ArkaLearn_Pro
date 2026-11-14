using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enums;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

/// <summary>Short-lived teacher story / news item shown in the messenger stories bar.</summary>
public class SupportTeacherStory : AggregateRoot
{
    public const int MaxVideoDurationSeconds = 60;
    public const int DefaultImageDurationSeconds = 5;

    public long TeacherUserId { get; private set; }
    public string Caption { get; private set; } = string.Empty;
    public string? MediaUrl { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public TeacherStoryMediaKind MediaKind { get; private set; }
    public int DurationSeconds { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }

    public IReadOnlyList<SupportTeacherStoryView> Views => _views;
    private readonly List<SupportTeacherStoryView> _views = [];

    private SupportTeacherStory() { }

    public static SupportTeacherStory Publish(
        long teacherUserId,
        string caption,
        string? mediaUrl,
        string? thumbnailUrl,
        TeacherStoryMediaKind mediaKind,
        int? durationSeconds = null,
        TimeSpan? ttl = null)
    {
        if (teacherUserId <= 0)
            throw new ArgumentException("Teacher user id is required.", nameof(teacherUserId));

        var kind = mediaKind;
        if (kind == TeacherStoryMediaKind.None && !string.IsNullOrWhiteSpace(mediaUrl))
            kind = TeacherStoryMediaKind.Image;

        var duration = ResolveDuration(kind, durationSeconds);
        var now = DateTime.UtcNow;
        return new SupportTeacherStory
        {
            TeacherUserId = teacherUserId,
            Caption = (caption ?? string.Empty).Trim(),
            MediaUrl = string.IsNullOrWhiteSpace(mediaUrl) ? null : mediaUrl.Trim(),
            ThumbnailUrl = string.IsNullOrWhiteSpace(thumbnailUrl) ? null : thumbnailUrl.Trim(),
            MediaKind = kind,
            DurationSeconds = duration,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(ttl ?? TimeSpan.FromHours(24)),
        };
    }

    public bool IsActive(DateTime utcNow) => !IsDelete && utcNow < ExpiresAtUtc;

    public void RegisterView(long viewerUserId)
    {
        if (viewerUserId <= 0 || _views.Any(v => v.ViewerUserId == viewerUserId))
            return;

        _views.Add(SupportTeacherStoryView.Create(Id, viewerUserId));
    }

    public void SoftDelete()
    {
        if (IsDelete) return;
        IsDelete = true;
    }

    private static int ResolveDuration(TeacherStoryMediaKind kind, int? durationSeconds)
    {
        if (kind == TeacherStoryMediaKind.Video)
        {
            var value = durationSeconds is > 0 ? durationSeconds.Value : MaxVideoDurationSeconds;
            return Math.Clamp(value, 1, MaxVideoDurationSeconds);
        }

        if (durationSeconds is > 0)
            return Math.Clamp(durationSeconds.Value, 1, 30);

        return DefaultImageDurationSeconds;
    }
}
