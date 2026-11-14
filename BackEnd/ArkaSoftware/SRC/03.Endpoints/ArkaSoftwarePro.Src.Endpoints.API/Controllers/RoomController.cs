using ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Uploads;
using ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;
using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Queries.GetRoomSessionsByRoomId;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Commands.SendMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomFile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AssignManagedStudentsToRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRooms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomUsers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LoginUserIntoRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoomFile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.SetRoomUserBlocked;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateRoomFile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.IssueStaffRoomJoinTicket;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.ForceEndRoomMeeting;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.RemoveRoomSeat;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using System.Collections.Concurrent;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public class RoomController : BaseController
    {
        private readonly RoomFileApplicationService files;
        private readonly RoomGuestAccessService guests;
        private const long MaxFileSizeBytes = FileUploadLimits.RoomFileSize;
        private const int MaxChunkSizeBytes = FileUploadLimits.MaxChunkSize;

        public sealed record UploadFileChunkRequest
        {
            public string UploadId { get; init; } = string.Empty;
            public int ChunkIndex { get; init; }
            public IFormFile? Chunk { get; init; }
        }

        public RoomController(RoomFileApplicationService files, RoomGuestAccessService guests)
        {
            this.files = files;
            this.guests = guests;
        }

        [HttpPost("Add")]
        public async Task<IActionResult> AddRoom(AddRoomCommand addRoomCommand)
         => await Create<AddRoomCommand, object>(addRoomCommand);

        [HttpPost("AddUser")]
        public async Task<IActionResult> AddRoomUser(AddRoomUserCommand addRoomUserCommand)
         => await Create<AddRoomUserCommand, string>(addRoomUserCommand);

        [HttpPost("AssignManagedStudents")]
        public async Task<IActionResult> AssignManagedStudents([FromBody] AssignManagedStudentsToRoomCommand command)
            => await Create<AssignManagedStudentsToRoomCommand, string>(command);

        [HttpPut("SetRoomUserBlocked")]
        [HttpPost("SetRoomUserBlocked")]
        public async Task<IActionResult> SetRoomUserBlocked([FromBody] SetRoomUserBlockedCommand command)
            => await Edit<SetRoomUserBlockedCommand, string>(command);

        [HttpGet("GetRoomById")]
        public async Task<IActionResult> GetRoomByRoomId([FromQuery] GetRoomByRoomIdQuery roomQuery)
        {
            Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            Response.Headers.Pragma = "no-cache";
            return await Query<GetRoomByRoomIdQuery, GetRoomByRoomIdQri>(roomQuery);
        }

        /// <summary>Get room by URL segment for entry page. Allow anonymous so users can open room link without login.</summary>
        [HttpGet("GetBySlug")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomBySlug([FromQuery] GetRoomBySlugQuery query)
            => await Query<GetRoomBySlugQuery, GetRoomByRoomIdQri>(query);

        [HttpPut("Update")]
        [HttpPost("Update")]
        public async Task<IActionResult> UpdateRoom([FromBody] UpdateRoomCommand command)
            => await Edit<UpdateRoomCommand, object>(command);

        [HttpDelete("Delete")]
        [HttpPost("Delete")]
        public async Task<IActionResult> DeleteRoom([FromQuery] long roomId)
            => await Edit<DeleteRoomCommand, string>(new DeleteRoomCommand { RoomId = roomId });

        [HttpGet("GetAllRoom")]
        public async Task<IActionResult> GetAllRooms([FromQuery] GetAllRoomsByOwnerIdQuery roomQuery)
        {
            if (!User.TryGetLongUserId(out var ownerUserId))
                return Unauthorized(new { message = "User is not authenticated." });

            Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            Response.Headers.Pragma = "no-cache";

            // برای جلوگیری از ناهماهنگی بین UserId ارسالی فرانت و کاربر لاگین‌شده
            roomQuery.UserId = ownerUserId;
            return await Query<GetAllRoomsByOwnerIdQuery, PagedData<GetAllRoomsByOwnerIdQri>>(roomQuery);
        }

        [HttpGet("GetRoomFiles")]
        public async Task<IActionResult> GetRoomFiles([FromQuery] GetRoomFilesByRoomIdQuery query)
            => await Query<GetRoomFilesByRoomIdQuery, List<GetRoomFilesByRoomIdQri>>(query);

        [HttpPost("DeleteRoomFile")]
        [HttpDelete("DeleteRoomFile")]
        public async Task<IActionResult> DeleteRoomFile([FromBody] DeleteRoomFileCommand command)
            => this.ToHttpResult(await files.DeleteRoomFile(command));

        [HttpGet("GetRoomSessions")]
        public async Task<IActionResult> GetRoomSessions([FromQuery] GetRoomSessionsByRoomIdQuery query)
            => await Query<GetRoomSessionsByRoomIdQuery, PagedData<GetRoomSessionsByRoomIdQri>>(query);

        /// <summary>Upload a file (video, audio, or slide) for a room. Max 50 MB.</summary>
        [ApiExplorerSettings(IgnoreApi = true)] // جلوگیری از خطای Swashbuckle در تولید سند برای IFormFile + FromForm
        [HttpPost("UploadFile")]
        [RequestSizeLimit(MaxFileSizeBytes)]
        [RequestFormLimits(MemoryBufferThreshold = (int)MaxFileSizeBytes,
            MultipartBodyLengthLimit = MaxFileSizeBytes)]
        public async Task<IActionResult> UploadRoomFile([FromForm]UpdateRoomFileCommand updateRoomFile)
            => this.ToHttpResult(await files.UploadRoomFile(new RoomFileUpload<UploadContent> { RoomId = updateRoomFile.RoomId, FileType = updateRoomFile.FileType, Title = updateRoomFile.Title, Description = updateRoomFile.Description, File = updateRoomFile.File.ToUploadContent() }));

        /// <summary>Initialize resumable multipart upload for room shared files.</summary>
        [HttpPost("UploadFileInit")]
        public async Task<IActionResult> UploadRoomFileInit([FromBody] UploadFileInitRequest request)
            => this.ToHttpResult(await files.UploadRoomFileInit(request));

        /// <summary>Upload one chunk for a resumable multipart room file upload.</summary>
        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("UploadFileChunk")]
        [RequestSizeLimit(MaxChunkSizeBytes + 512 * 1024)]
        [RequestFormLimits(MemoryBufferThreshold = MaxChunkSizeBytes + 512 * 1024,
            MultipartBodyLengthLimit = MaxChunkSizeBytes + 512 * 1024)]
        public async Task<IActionResult> UploadRoomFileChunk([FromForm] UploadFileChunkRequest request)
            => this.ToHttpResult(await files.UploadRoomFileChunk(new UploadFileChunkRequest<UploadContent> { UploadId = request.UploadId, ChunkIndex = request.ChunkIndex, Chunk = request.Chunk.ToUploadContent() }));

        /// <summary>Finalize multipart upload, merge chunks and persist RoomFile record.</summary>
        [HttpPost("UploadFileComplete")]
        public async Task<IActionResult> UploadRoomFileComplete([FromBody] UploadFileCompleteRequest request)
            => this.ToHttpResult(await files.UploadRoomFileComplete(request));

        [HttpPost("UploadFileAbort")]
        public async Task<IActionResult> UploadRoomFileAbort([FromBody] UploadFileAbortRequest request)
            => this.ToHttpResult(await files.UploadRoomFileAbort(request));

        [HttpGet("GetAllUserInRoom")]
        public async Task<IActionResult> GetAllUserRooms([FromQuery] GetAllRoomUserByRoomIdQuery roomQuery)
            => await Query<GetAllRoomUserByRoomIdQuery, PagedData<GetAllRoomUserByRoomIdQri>>(roomQuery);

        [HttpPost("msg-send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageCommand sendMessageCommand)
        {
            return await Create<SendMessageCommand, string>(sendMessageCommand);
        }

        [HttpPut("user/update-status")]
        public async Task<IActionResult> UpdateUsersStatus([FromBody] UpdateUserStatusCommand updateUserStatusCommand)
        {
            return await Create<UpdateUserStatusCommand, bool>(updateUserStatusCommand);
        }

        [HttpGet("msg-search")]
        public async Task<IActionResult> SearchMessageWithRoomId([FromQuery] GetAllMessageWithRoomIdQuery allMessageWithRoomIdQuery)
            => await Query<GetAllMessageWithRoomIdQuery, PagedData<GetAllMessageWithRoomIdQri>>(allMessageWithRoomIdQuery);

        /// <summary>Issue a short-lived meeting join ticket for the room owner (separate from dashboard JWT).</summary>
        [HttpPost("IssueStaffJoinTicket")]
        public async Task<IActionResult> IssueStaffJoinTicket([FromBody] IssueStaffRoomJoinTicketCommand command)
        {
            if (!User.TryGetLongUserId(out var userId))
                return Unauthorized();
            command.RequestingUserId = userId;
            command.RequestingIsDashboardAdmin = User.IsDashboardAdminRole();
            return await Create<IssueStaffRoomJoinTicketCommand, object>(command);
        }

        /// <summary>Issue guest meeting ticket for public room entry.</summary>
        [HttpPost("IssueGuestJoinTicket")]
        [AllowAnonymous]
        public async Task<IActionResult> IssueGuestJoinTicket([FromBody] IssueGuestJoinTicketRequest request)
            => this.ToHttpResult(await guests.IssueGuestJoinTicket(request));

        /// <summary>Force-end the active meeting for a room (dashboard admin).</summary>
        [HttpPost("ForceEndActiveMeeting")]
        public async Task<IActionResult> ForceEndActiveMeeting([FromBody] ForceEndRoomMeetingCommand command)
        {
            if (!User.TryGetLongUserId(out var userId))
                return Unauthorized();
            command.RequestingUserId = userId;
            return await Edit<ForceEndRoomMeetingCommand, bool>(command);
        }

        [HttpPost("EndSessionById")]
        public async Task<IActionResult> EndSessionById([FromBody] EndRoomSessionByIdCommand command)
            => await Edit<EndRoomSessionByIdCommand, bool>(command);

        [HttpPost("DeleteSession")]
        [HttpPost("DeleteRoomSession")]
        public async Task<IActionResult> DeleteSession([FromBody] DeleteRoomSessionCommand command)
            => await Edit<DeleteRoomSessionCommand, bool>(command);

        [HttpPost("SetSessionIgnored")]
        public async Task<IActionResult> SetSessionIgnored([FromBody] SetRoomSessionIgnoredCommand command)
            => await Edit<SetRoomSessionIgnoredCommand, bool>(command);

        [HttpPost("RemoveRoomSeat")]
        public async Task<IActionResult> RemoveRoomSeat([FromBody] RemoveRoomSeatCommand command)
            => await Edit<RemoveRoomSeatCommand, bool>(command);
    }
}
