using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ClosePlatformSupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.CreatePlatformSupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendPlatformSupportTicketMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class SupportTicketAdminController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets.SearchSupportTicketsQuery query)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        return await Query<ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets.SearchSupportTicketsQuery,
            Framework.Src.Core.RequestResponse.Queries.PagedData<ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets.SearchSupportTicketQri>>(query);
    }

    [HttpGet("GetById")]
    public async Task<IActionResult> GetById(
        [FromQuery] long ticketId,
        [FromQuery] int messageTake = 10,
        [FromQuery] long? beforeMessageId = null)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (!TryGetCurrentUserId(out var staffUserId)) return Unauthorized();

        return await Query<GetAdminPlatformSupportTicketByIdQuery, PlatformSupportTicketDetailQri>(
            new GetAdminPlatformSupportTicketByIdQuery
            {
                StaffUserId = staffUserId,
                TicketId = ticketId,
                MessageTake = messageTake,
                BeforeMessageId = beforeMessageId,
            });
    }

    [HttpPost("SendMessage")]
    public async Task<IActionResult> SendMessage([FromBody] SendPlatformSupportTicketMessageCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (!TryGetCurrentUserId(out var staffUserId)) return Unauthorized();

        command.UserId = staffUserId;
        command.IsStaffMessage = true;
        return await Create<SendPlatformSupportTicketMessageCommand, string>(command);
    }

    [HttpPost("UploadImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/platform-tickets");
        return Ok(new { url });
    }

    [HttpPost("UploadAudio")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> UploadAudio(IFormFile file)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "audio/platform-tickets");
        return Ok(new { url });
    }

    [HttpPost("UploadVideo")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> UploadVideo(IFormFile file)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "videos/platform-tickets");
        return Ok(new { url });
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
