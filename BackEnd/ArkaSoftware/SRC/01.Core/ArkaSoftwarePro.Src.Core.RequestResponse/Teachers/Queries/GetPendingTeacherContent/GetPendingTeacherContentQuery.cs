using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherContent;

public class GetPendingTeacherContentQuery : IQuery<List<PendingTeacherContentQri>>, IWebRequest
{
    public string Path => "api/Service/Teacher/GetPendingContent";
}

public class PendingTeacherContentQri
{
    public string ContentType { get; set; } = string.Empty;
    public long ContentId { get; set; }
    public long TeacherId { get; set; }
    public long? UserId { get; set; }
    public string TeacherDisplayName { get; set; } = string.Empty;
    public string TeacherUserName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? PreviewUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
}
