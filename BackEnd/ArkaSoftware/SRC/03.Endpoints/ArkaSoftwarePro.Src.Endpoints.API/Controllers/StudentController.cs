using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.UpdateStudentProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetCourseEnrollments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.GetStudentProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchUserCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchProjectQuestions;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectQuestions.Queries.SearchUserProjectQuestions;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchUserCommunityThreads;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class StudentController : BaseController
    {
        [HttpGet("SearchPortalStudents")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchPortalStudents([FromQuery] SearchPortalStudentsQuery query)
            => await Query<SearchPortalStudentsQuery, PagedData<PortalStudentQri>>(query);

        [HttpGet("SearchUserCourseComments")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> SearchUserCourseComments([FromQuery] SearchUserCourseCommentsQuery query)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<SearchUserCourseCommentsQuery, PagedData<SearchUserCourseCommentQri>>(query);
        }

        [HttpGet("SearchUserProjectQuestions")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> SearchUserProjectQuestions([FromQuery] SearchUserProjectQuestionsQuery query)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<SearchUserProjectQuestionsQuery, PagedData<SearchProjectQuestionQri>>(query);
        }

        [HttpGet("SearchUserCommunityThreads")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> SearchUserCommunityThreads([FromQuery] SearchUserCommunityThreadsQuery query)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<SearchUserCommunityThreadsQuery, PagedData<SearchCommunityThreadQri>>(query);
        }

        [HttpGet("GetCourseEnrollments")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetCourseEnrollments([FromQuery] GetCourseEnrollmentsQuery query)
            => await Query<GetCourseEnrollmentsQuery, PagedData<CourseEnrollmentQri>>(query);

        [HttpGet("GetProfile")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> GetProfile([FromQuery] GetStudentProfileQuery query)
            => Query<GetStudentProfileQuery, StudentProfileQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("UpdateProfile")]
        [HttpPost("UpdateProfile")]
        public Task<IActionResult> UpdateProfile([FromBody] UpdateStudentProfileCommand command)
            => Edit<UpdateStudentProfileCommand, string>(command);
    }
}
