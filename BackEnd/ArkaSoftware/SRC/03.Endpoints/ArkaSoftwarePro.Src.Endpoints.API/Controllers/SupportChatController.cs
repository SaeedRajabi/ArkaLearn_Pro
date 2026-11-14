using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.HeartbeatDesktopPresence;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.CloseSupportConversation;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteSupportConversation;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteSupportMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteTeacherStory;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.MarkSupportConversationRead;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.MarkSupportMessagesDelivered;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.OpenSupportConversation;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.PublishTeacherStory;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.RegisterTeacherStoryView;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.ReopenSupportConversation;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendSupportMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SubmitSupportConversationRating;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportConversationSubject;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetActiveTeacherStories;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetDesktopUserPresence;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportConversations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetStudentSupportTeachers;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
public class SupportChatController(FileStoragePathSaver pathSaver, INotificationSettingsProvider notificationSettingsProvider) : BaseController
{
    [AllowAnonymous]
    [HttpGet("GetClientSettings")]
    public async Task<IActionResult> GetClientSettings()
    {
        var settings = await notificationSettingsProvider.GetCurrentAsync();
        return Ok(new
        {
            notificationSoundKey = settings?.SupportChatNotificationSoundKey ?? "chime",
            unreadSmsDelayMinutes = settings?.SupportChatUnreadSmsDelayMinutes ?? 10,
        });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetStudentTeachers")]
    public async Task<IActionResult> GetStudentTeachers()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetStudentSupportTeachersQuery, List<StudentSupportTeacherQri>>(
            new GetStudentSupportTeachersQuery { UserId = userId });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetMySupportStudents")]
    public async Task<IActionResult> GetMySupportStudents(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string? search = null)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetMySupportStudentsQuery, PagedData<SupportStudentListQri>>(
            new GetMySupportStudentsQuery
            {
                TeacherUserId = userId,
                PageNumber = pageNumber,
                PageSize = pageSize,
                Search = search,
                NeedTotalCount = true,
            });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetMyConversations")]
    public async Task<IActionResult> GetMyConversations([FromQuery] long? studentUserId = null)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetMySupportConversationsQuery, List<SupportConversationListQri>>(
            new GetMySupportConversationsQuery { UserId = userId, StudentUserId = studentUserId });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetActiveStories")]
    public async Task<IActionResult> GetActiveStories()
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetActiveTeacherStoriesQuery, List<TeacherStoryQri>>(
            new GetActiveTeacherStoriesQuery
            {
                UserId = userId,
                IsAdmin = User.IsDashboardAdminRole(),
            });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("PublishStory")]
    public async Task<IActionResult> PublishStory([FromBody] PublishTeacherStoryCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        if (!User.IsStaffProfessorRole()) return Forbid();
        command.UserId = userId;
        return await Create<PublishTeacherStoryCommand, long>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("RegisterStoryView")]
    public async Task<IActionResult> RegisterStoryView([FromBody] RegisterTeacherStoryViewCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<RegisterTeacherStoryViewCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("DeleteStory")]
    public async Task<IActionResult> DeleteStory([FromBody] DeleteTeacherStoryCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        command.IsAdmin = User.IsDashboardAdminRole();
        return await Edit<DeleteTeacherStoryCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetOnlineDesktopUsers")]
    public async Task<IActionResult> GetOnlineDesktopUsers([FromQuery] int take = 200)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
        if (!User.IsDashboardAdminRole()) return Forbid();

        var rows = await HttpContext.RequestServices
            .GetRequiredService<ISupportChatQueryRepository>()
            .GetOnlineDesktopUsersAsync(take);
        return Ok(rows);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetUserPresence")]
    public async Task<IActionResult> GetUserPresence([FromQuery] long userId)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
        if (userId <= 0) return BadRequest("userId is required.");
        return await Query<GetDesktopUserPresenceQuery, DesktopUserPresenceQri>(
            new GetDesktopUserPresenceQuery { TargetUserId = userId });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("HeartbeatPresence")]
    public async Task<IActionResult> HeartbeatPresence([FromBody] HeartbeatDesktopPresenceCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<HeartbeatDesktopPresenceCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpGet("GetById")]
    public async Task<IActionResult> GetById(
        [FromQuery] long conversationId,
        [FromQuery] int messageTake = 10,
        [FromQuery] long? beforeMessageId = null)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        return await Query<GetSupportConversationByIdQuery, SupportConversationDetailQri>(
            new GetSupportConversationByIdQuery
            {
                UserId = userId,
                ConversationId = conversationId,
                MessageTake = messageTake,
                BeforeMessageId = beforeMessageId,
            });
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("Open")]
    public async Task<IActionResult> Open([FromBody] OpenSupportConversationCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Create<OpenSupportConversationCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("SendMessage")]
    public async Task<IActionResult> SendMessage([FromBody] SendSupportMessageCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Create<SendSupportMessageCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("MarkRead")]
    public async Task<IActionResult> MarkRead([FromBody] MarkSupportConversationReadCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<MarkSupportConversationReadCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("MarkDelivered")]
    public async Task<IActionResult> MarkDelivered([FromBody] MarkSupportMessagesDeliveredCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<MarkSupportMessagesDeliveredCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("Close")]
    public async Task<IActionResult> Close([FromBody] CloseSupportConversationCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<CloseSupportConversationCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("Reopen")]
    public async Task<IActionResult> Reopen([FromBody] ReopenSupportConversationCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<ReopenSupportConversationCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("SubmitRating")]
    public async Task<IActionResult> SubmitRating([FromBody] SubmitSupportConversationRatingCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Create<SubmitSupportConversationRatingCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("UpdateSubject")]
    public async Task<IActionResult> UpdateSubject([FromBody] UpdateSupportConversationSubjectCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<UpdateSupportConversationSubjectCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("DeleteConversation")]
    public async Task<IActionResult> DeleteConversation([FromBody] DeleteSupportConversationCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<DeleteSupportConversationCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("UpdateMessage")]
    public async Task<IActionResult> UpdateMessage([FromBody] UpdateSupportMessageCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<UpdateSupportMessageCommand, string>(command);
    }

    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [HttpPost("DeleteMessage")]
    public async Task<IActionResult> DeleteMessage([FromBody] DeleteSupportMessageCommand command)
    {
        if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
        command.UserId = userId;
        return await Edit<DeleteSupportMessageCommand, string>(command);
    }

    [HttpPost("UploadImage")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "images/support-chat");
        return Ok(new { url });
    }

    [HttpPost("UploadAudio")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UploadAudio(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "audio/support-chat");
        return Ok(new { url });
    }

    [HttpPost("UploadVideo")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [RequestSizeLimit(80L * 1024 * 1024)]
    public async Task<IActionResult> UploadVideo(IFormFile file)
    {
        if (!User.IsStaffProfessorRole() && !TryGetCurrentUserId(out _))
            return Unauthorized();

        if (file is { Length: > 80L * 1024 * 1024 })
            return BadRequest("Video must be at most 80 MB.");

        if (file == null || file.Length == 0) return BadRequest("File is required.");
        var url = await pathSaver.SavePublicAsync(file, "videos/support-chat");
        return Ok(new { url });
    }

    [HttpPost("UploadStoryMedia")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    [RequestSizeLimit(80L * 1024 * 1024)]
    public async Task<IActionResult> UploadStoryMedia(IFormFile file, [FromForm] string? mediaKind = null)
    {
        if (!TryGetCurrentUserId(out _)) return Unauthorized();
        if (!User.IsStaffProfessorRole()) return Forbid();
        if (file == null || file.Length == 0) return BadRequest("File is required.");

        var kind = (mediaKind ?? string.Empty).Trim().ToLowerInvariant();
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isVideo = kind is "video" or "2"
            || ext is ".mp4" or ".webm" or ".mov" or ".m4v";

        if (isVideo && file.Length > 80L * 1024 * 1024)
            return BadRequest("Video must be at most 80 MB.");

        if (!isVideo && file.Length > 12L * 1024 * 1024)
            return BadRequest("Image must be at most 12 MB.");

        var folder = isVideo ? "videos/teacher-stories" : "images/teacher-stories";
        var url = await pathSaver.SavePublicAsync(file, folder);
        return Ok(new { url, mediaKind = isVideo ? 2 : 1 });
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
