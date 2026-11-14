using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherCourseComments;

public class GetTeacherCourseCommentsQuery : IQuery<List<GetTeacherCourseCommentsQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long? CourseId { get; set; }
    public bool? OnlyPending { get; set; }
    public string Path => "/api/Service/Course/GetTeacherComments";
}

public class GetTeacherCourseCommentsQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Likes { get; set; }
    public bool IsApproved { get; set; }
    public string TimeStamp { get; set; } = string.Empty;
    public CommentAuthorQri? Author { get; set; }
    public long? ParentId { get; set; }
    public ICollection<GetTeacherCourseCommentsQri> Replies { get; set; } = new List<GetTeacherCourseCommentsQri>();
}
