using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ClosePlatformSupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.CreatePlatformSupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.ReplySupportTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendContactEmailOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendPlatformSupportTicketMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SubmitContactRequest;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetSupportTicketById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class SupportTicketController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpPost("EmailOtp/Send")]
    [AllowAnonymous]
    public async Task<IActionResult> SendEmailOtp([FromBody] SendContactEmailOtpCommand command)
        => await Create<SendContactEmailOtpCommand, object>(command);

    [HttpPost("Submit")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] SubmitContactRequestCommand command)
        => await Create<SubmitContactRequestCommand, string>(command);

    [HttpGet("GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetById([FromQuery] long ticketId)
        => await Query<GetSupportTicketByIdQuery, SupportTicketQri>(
            new GetSupportTicketByIdQuery { TicketId = ticketId });

    [HttpGet("Search")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Search([FromQuery] SearchSupportTicketsQuery query)
        => await Query<SearchSupportTicketsQuery, PagedData<SearchSupportTicketQri>>(query);

    [HttpPost("Reply")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Reply([FromBody] ReplySupportTicketCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });

        command.ReviewerUserId = userId;
        return await Edit<ReplySupportTicketCommand, string>(command);
    }

    [HttpPost("Platform/Create")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreatePlatform([FromBody] CreatePlatformSupportTicketCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Create<CreatePlatformSupportTicketCommand, string>(command);
    }

    [HttpGet("Platform/GetMy")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetMyPlatformTickets()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetMyPlatformSupportTicketsQuery, List<PlatformSupportTicketListQri>>(
            new GetMyPlatformSupportTicketsQuery { UserId = userId });
    }

    [HttpGet("Platform/GetById")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetPlatformById(
        [FromQuery] long ticketId,
        [FromQuery] int messageTake = 10,
        [FromQuery] long? beforeMessageId = null)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetPlatformSupportTicketByIdQuery, PlatformSupportTicketDetailQri>(
            new GetPlatformSupportTicketByIdQuery
            {
                UserId = userId,
                TicketId = ticketId,
                MessageTake = messageTake,
                BeforeMessageId = beforeMessageId,
            });
    }

    [HttpPost("Platform/SendMessage")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SendPlatformMessage([FromBody] SendPlatformSupportTicketMessageCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        command.IsStaffMessage = false;
        return await Create<SendPlatformSupportTicketMessageCommand, string>(command);
    }

    [HttpPost("Platform/Close")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ClosePlatform([FromBody] ClosePlatformSupportTicketCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<ClosePlatformSupportTicketCommand, string>(command);
    }

    [HttpPost("Platform/UploadImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/platform-tickets");
        return Ok(new { url });
    }

    [HttpPost("Platform/UploadAudio")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadAudio(IFormFile file)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "audio/platform-tickets");
        return Ok(new { url });
    }

    [HttpPost("Platform/UploadVideo")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadVideo(IFormFile file)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
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
