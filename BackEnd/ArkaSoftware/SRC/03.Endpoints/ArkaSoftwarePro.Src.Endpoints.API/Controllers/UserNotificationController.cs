using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.DeleteNotification;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkAllNotificationsRead;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkNotificationRead;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetMyNotifications;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetUnreadNotificationCount;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class UserNotificationController : BaseController
{
    [HttpGet("GetMy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMy(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] int take = 0)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        if (take > 0)
        {
            page = 1;
            pageSize = take;
        }

        return await Query<GetMyNotificationsQuery, PagedUserNotificationsQri>(
            new GetMyNotificationsQuery { UserId = userId, Page = page, PageSize = pageSize });
    }

    [HttpGet("UnreadCount")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UnreadCount()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        return await Query<GetUnreadNotificationCountQuery, int>(
            new GetUnreadNotificationCountQuery { UserId = userId });
    }

    [HttpPut("MarkRead")]
    [HttpPost("MarkRead")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> MarkRead([FromBody] MarkNotificationReadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        command.UserId = userId;
        return await Edit<MarkNotificationReadCommand, string>(command);
    }

    [HttpPut("MarkAllRead")]
    [HttpPost("MarkAllRead")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> MarkAllRead()
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        return await Edit<MarkAllNotificationsReadCommand, string>(
            new MarkAllNotificationsReadCommand { UserId = userId });
    }

    [HttpDelete("Delete")]
    [HttpPost("Delete")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Delete([FromBody] DeleteNotificationCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        command.UserId = userId;
        return await Edit<DeleteNotificationCommand, string>(command);
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
