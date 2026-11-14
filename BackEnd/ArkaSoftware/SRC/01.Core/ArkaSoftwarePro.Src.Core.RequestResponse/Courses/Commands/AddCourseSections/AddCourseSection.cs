using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseSections
{
    public class AddCourseSection : ICommand<string>, IWebRequest
    {

        public long CourseId { get; set; }
        public string SectionTitle { get; set; } = string.Empty;
        public List<string> LessonTitles { get; set; } = new();

        public string Path => "api/Service/Course/AddSection";
    }
}
