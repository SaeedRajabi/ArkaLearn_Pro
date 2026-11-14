using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourse;

[InvalidatesCache(CacheRegion.Courses)]
public class DeleteCourseCommand : ICommand<string>, IWebRequest
{
    public long CourseId { get; set; }
    public string Path => "/api/Service/Course/Delete";
}
