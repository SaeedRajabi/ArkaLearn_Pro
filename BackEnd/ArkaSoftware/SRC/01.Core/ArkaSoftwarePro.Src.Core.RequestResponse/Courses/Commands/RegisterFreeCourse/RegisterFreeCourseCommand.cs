using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RegisterFreeCourse
{
    public class RegisterFreeCourseCommand : ICommand<string>, IWebRequest
    {
        public long CourseId { get; set; }
        public string Path => "/api/Service/Course/RegisterFree";
    }
}
