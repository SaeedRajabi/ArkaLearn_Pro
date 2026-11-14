using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendAdminSupportStaffMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminSupportConversationById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminTeacherSupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.SearchAdminSupportTeachers;
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
public class SupportChatAdminController : BaseController
{
    [HttpGet("SearchTeachers")]
    public async Task<IActionResult> SearchTeachers([FromQuery] SearchAdminSupportTeachersQuery query)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (query.PageSize <= 0) query.PageSize = 7;
        return await Query<SearchAdminSupportTeachersQuery, PagedData<AdminSupportTeacherQri>>(query);
    }

    [HttpGet("GetTeacherConversations")]
    public async Task<IActionResult> GetTeacherConversations([FromQuery] long teacherUserId)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Query<GetAdminTeacherSupportConversationsQuery, List<AdminSupportConversationListQri>>(
            new GetAdminTeacherSupportConversationsQuery { TeacherUserId = teacherUserId });
    }

    [HttpGet("GetConversationById")]
    public async Task<IActionResult> GetConversationById(
        [FromQuery] long teacherUserId,
        [FromQuery] long conversationId,
        [FromQuery] int messageTake = 10,
        [FromQuery] long? beforeMessageId = null)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (!TryGetCurrentUserId(out var staffUserId)) return Unauthorized();

        return await Query<GetAdminSupportConversationByIdQuery, SupportConversationDetailQri>(
            new GetAdminSupportConversationByIdQuery
            {
                StaffUserId = staffUserId,
                TeacherUserId = teacherUserId,
                ConversationId = conversationId,
                MessageTake = messageTake,
                BeforeMessageId = beforeMessageId,
            });
    }

    [HttpPost("SendStaffMessage")]
    public async Task<IActionResult> SendStaffMessage([FromBody] SendAdminSupportStaffMessageCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (!TryGetCurrentUserId(out var staffUserId)) return Unauthorized();

        command.StaffUserId = staffUserId;
        return await Create<SendAdminSupportStaffMessageCommand, string>(command);
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
