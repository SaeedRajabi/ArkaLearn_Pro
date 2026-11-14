using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetActiveTeacherStories;

public class GetActiveTeacherStoriesQuery : IQuery<List<TeacherStoryQri>>
{
    public long UserId { get; set; }
    public bool IsAdmin { get; set; }
}

public class TeacherStoryQri
{
    public long Id { get; set; }
    public long TeacherUserId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string? TeacherAvatarUrl { get; set; }
    public string Caption { get; set; } = string.Empty;
    public string? MediaUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    /// <summary>0=None, 1=Image, 2=Video</summary>
    public int MediaKind { get; set; }
    public int DurationSeconds { get; set; }
    public bool HasUnseen { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
