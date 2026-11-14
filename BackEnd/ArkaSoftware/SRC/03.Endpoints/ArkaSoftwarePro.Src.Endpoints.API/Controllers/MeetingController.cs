using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class MeetingController : BaseController
    {
        private readonly IHubContext<MeetingHub> _hubContext;

        public MeetingController(IHubContext<MeetingHub> hubContext)
        {
            _hubContext = hubContext;
        }


        //// ایجاد جلسه جدید
        //[HttpPost("create")]
        //public async Task<IActionResult> CreateMeeting(CreateMeetingCommand createMeeting)
        //{
        //    return await Create<CreateMeetingCommand, long>(createMeeting);
        //}


        //// ایجاد جلسه جدید
        //[HttpGet("read-all")]
        //public async Task<IActionResult> ReadAllByUserId(GetAllMeetingByUserIdQuery readAllQuery)
        //{
        //    return await Query<GetAllMeetingByUserIdQuery, PagedData<GetAllMeetingByUserIdQri>>(readAllQuery);
        //}

        //// پیوستن به جلسه
        //[HttpPost("join")]
        //public async Task<IActionResult> JoinMeeting([FromQuery] string meetingId, [FromQuery] string userName)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("UserJoined", userName, meetingId);
        //    return Ok(new { Message = $"{userName} joined the meeting {meetingId}" });
        //}

        //// خروج از جلسه
        //[HttpPost("leave")]
        //public async Task<IActionResult> LeaveMeeting([FromQuery] string meetingId, [FromQuery] string userName)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("UserLeft", userName, meetingId);
        //    return Ok(new { Message = $"{userName} left the meeting {meetingId}" });
        //}

        //// ارسال پیام متنی
        //[HttpPost("send-message")]
        //public async Task<IActionResult> SendMessage(SendChatMessageCommand chatMessage)
        //{
        //    return await Create<SendChatMessageCommand, bool>(chatMessage);
        //}

        //// بی‌صدا/بازصدا کردن میکروفن
        //[HttpPost("toggle-mute")]
        //public async Task<IActionResult> ToggleMute([FromQuery] string meetingId, [FromQuery] string participantId, [FromQuery] bool isMuted)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("ParticipantMuted", participantId, isMuted);
        //    return Ok(new { Message = "Mute status toggled" });
        //}

        //// فعال/غیرفعال کردن ویدئو
        //[HttpPost("toggle-video")]
        //public async Task<IActionResult> ToggleVideo([FromQuery] string meetingId, [FromQuery] string participantId, [FromQuery] bool isVideoOn)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("ParticipantVideoToggled", participantId, isVideoOn);
        //    return Ok(new { Message = "Video status toggled" });
        //}

        //// شروع اشتراک‌گذاری صفحه
        //[HttpPost("start-screen-share")]
        //public async Task<IActionResult> StartScreenShare([FromQuery] string meetingId, [FromQuery] string participantId)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("ParticipantScreenShared", participantId);
        //    return Ok(new { Message = "Screen sharing started" });
        //}

        //// توقف اشتراک‌گذاری صفحه
        //[HttpPost("stop-screen-share")]
        //public async Task<IActionResult> StopScreenShare([FromQuery] string meetingId, [FromQuery] string participantId)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", participantId);
        //    return Ok(new { Message = "Screen sharing stopped" });
        //}

        //// خاتمه جلسه توسط میزبان
        //[HttpPost("end-meeting")]
        //public async Task<IActionResult> EndMeeting([FromQuery] string meetingId)
        //{
        //    await _hubContext.Clients.Group(meetingId).SendAsync("MeetingEnded", meetingId);
        //    return Ok(new { Message = "Meeting ended" });
        //}
    }
}
