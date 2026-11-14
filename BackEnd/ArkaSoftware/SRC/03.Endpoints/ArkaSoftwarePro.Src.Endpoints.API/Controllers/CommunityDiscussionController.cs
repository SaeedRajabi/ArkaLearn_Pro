using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.LikeCommunityReply;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.ReactCommunityThread;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubmitCommunityReply;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubmitCommunityThread;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubscribeCommunityThread;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.UnsubscribeCommunityThread;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using CommunityThreadDetailQri = ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById.CommunityThreadDetailQri;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class CommunityDiscussionController(FileStoragePathSaver pathSaver) : BaseController
{
    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] SearchCommunityThreadsQuery query)
        => await Query<SearchCommunityThreadsQuery, PagedData<SearchCommunityThreadQri>>(query);

    [HttpGet("GetById")]
    public async Task<IActionResult> GetById([FromQuery] long threadId)
    {
        long? userId = TryGetCurrentUserId(out var uid) ? uid : null;
        return await Query<GetCommunityThreadByIdQuery, CommunityThreadDetailQri>(
            new GetCommunityThreadByIdQuery { ThreadId = threadId, CurrentUserId = userId });
    }

    [HttpPost("Submit")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Submit([FromBody] SubmitCommunityThreadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<SubmitCommunityThreadCommand, string>(command);
    }

    [HttpPost("SubmitReply")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> SubmitReply([FromBody] SubmitCommunityReplyCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<SubmitCommunityReplyCommand, string>(command);
    }

    [HttpPut("LikeReply")]
    [HttpPost("LikeReply")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> LikeReply([FromBody] LikeCommunityReplyCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Edit<LikeCommunityReplyCommand, string>(command);
    }

    [HttpPut("React")]
    [HttpPost("React")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> React([FromBody] ReactCommunityThreadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Edit<ReactCommunityThreadCommand, CommunityThreadReactionResult>(command);
    }

    [HttpPost("Subscribe")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeCommunityThreadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<SubscribeCommunityThreadCommand, string>(command);
    }

    [HttpPost("Unsubscribe")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeCommunityThreadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return Unauthorized(new { message = "User is not authenticated." });
        command.UserId = userId;
        return await Create<UnsubscribeCommunityThreadCommand, string>(command);
    }

    [HttpPost("UploadImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/community-qa");
        return Ok(new { url });
    }

    [HttpPost("UploadAudio")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadAudio(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "audio/community-qa");
        return Ok(new { url });
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
