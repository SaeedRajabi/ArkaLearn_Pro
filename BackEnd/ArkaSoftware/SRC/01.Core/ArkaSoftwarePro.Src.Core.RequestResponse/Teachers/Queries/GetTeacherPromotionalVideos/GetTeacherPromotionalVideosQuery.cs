using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPromotionalVideos;

public class GetTeacherPromotionalVideosQuery : IQuery<List<TeacherPromotionalVideoPublicQri>>, IWebRequest
{
    public long? UserId { get; set; }
    public long? TeacherId { get; set; }
    public string? UserName { get; set; }
    public bool ForEdit { get; set; }
    public long ViewerUserId { get; set; }
    public string Path => "/api/Service/Teacher/GetPromotionalVideos";
}

public class GetPromotionalVideoCommentsQuery : IQuery<List<PromotionalVideoCommentQri>>, IWebRequest
{
    public long VideoId { get; set; }
    public string Path => "/api/Service/Teacher/GetPromotionalVideoComments";
}

public class TeacherPromotionalVideoPublicQri
{
    public long Id { get; set; }
    public long? TeacherUserId { get; set; }
    public string? TeacherDisplayName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int ViewCount { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsLikedByViewer { get; set; }
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}

public class PromotionalVideoCommentQri
{
    public long Id { get; set; }
    public long VideoId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string TimeStamp { get; set; } = string.Empty;
    public long? ParentId { get; set; }
    public PromotionalVideoCommentAuthorQri? Author { get; set; }
    public List<PromotionalVideoCommentQri> Replies { get; set; } = [];
}

public class PromotionalVideoCommentAuthorQri
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? AvatarUrl { get; set; }
}
