using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseComments
{
    public class AddCourseComment : ICommand<string>, IWebRequest
    {
        public long CourseId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public int Rating { get; set; }
        public int Like { get; set; }
        public long ParentId { get; set; }
        public string Path => "/api/Service/Course/AddComment";
    }
}
