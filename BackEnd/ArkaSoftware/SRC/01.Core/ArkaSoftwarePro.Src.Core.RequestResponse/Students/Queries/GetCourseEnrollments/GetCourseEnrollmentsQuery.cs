using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments
{
    public class GetCourseEnrollmentsQuery : PageQuery<PagedData<CourseEnrollmentQri>>, IWebRequest
    {
        /// <summary>0 = all courses</summary>
        public long CourseId { get; set; }

        /// <summary>0 = all students</summary>
        public long UserId { get; set; }

        /// <summary>0 = all; otherwise Students.Id or legacy enrollment StudentId</summary>
        public long StudentId { get; set; }

        public string Path => "/api/Service/Student/GetCourseEnrollments";
    }
}
