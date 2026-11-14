using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.LikeCourseComments
{
    public class LikeCourseComment : ICommand<string>, IWebRequest
    {
        public long CourseId { get; set; }
        public long CommentId { get; set; }
        public string Path => "/api/Service/Course/LikeComment";
    }
}