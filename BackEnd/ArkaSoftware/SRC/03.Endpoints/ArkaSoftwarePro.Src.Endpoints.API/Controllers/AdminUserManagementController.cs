using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchUserCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentRooms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentsToTeacher;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminBulkNotify;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminCreateUser;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminSendUserNotifications;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class AdminUserManagementController : BaseController
{
    [HttpPost("AdminCreate")]
    public async Task<IActionResult> AdminCreate([FromBody] AdminCreateUserCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Create<AdminCreateUserCommand, AdminCreateUserResult>(command);
    }

    [HttpPost("BulkNotify")]
    public async Task<IActionResult> BulkNotify([FromBody] AdminBulkNotifyCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Create<AdminBulkNotifyCommand, AdminBulkNotifyResult>(command);
    }

    [HttpPost("SendNotifications")]
    public async Task<IActionResult> SendNotifications([FromBody] AdminSendUserNotificationsCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Create<AdminSendUserNotificationsCommand, AdminSendUserNotificationsResult>(command);
    }

    [HttpPost("AssignStudentRooms")]
    public async Task<IActionResult> AssignStudentRooms([FromBody] AdminAssignStudentRoomsCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Create<AdminAssignStudentRoomsCommand, AdminAssignStudentRoomsResult>(command);
    }

    [HttpPost("AssignStudentsToTeacher")]
    public async Task<IActionResult> AssignStudentsToTeacher([FromBody] AdminAssignStudentsToTeacherCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Create<AdminAssignStudentsToTeacherCommand, AdminAssignStudentsToTeacherResult>(command);
    }
}
