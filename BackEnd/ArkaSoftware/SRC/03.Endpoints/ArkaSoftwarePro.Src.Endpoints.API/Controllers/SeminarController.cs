using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarStatus;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.AddSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.AddSeminarComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterUserForSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.DeleteSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarMedia;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.ApproveSeminarComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.Favorites;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.CanUserEnterSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllCommentsBySeminarId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminarIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;
using SeminarRegistrationQri = ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations.SeminarRegistrationQri;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class SeminarController : BaseController
    {
        private readonly IWebHostEnvironment _env;
        private readonly ISeminarQueriesRepository _seminarQueriesRepository;
        private readonly ISeminarCommandRepository _seminarCommandRepository;
        private readonly IRoomCommandRepository _roomCommandRepository;
        private readonly IUserQueryRepository _userQueryRepository;
        private readonly IJwtGenerator _jwtGenerator;
        private readonly IConfiguration _configuration;
        private readonly ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IFileStorage _fileStorage;

        public SeminarController(
            IWebHostEnvironment env,
            ISeminarQueriesRepository seminarQueriesRepository,
            ISeminarCommandRepository seminarCommandRepository,
            IRoomCommandRepository roomCommandRepository,
            IUserQueryRepository userQueryRepository,
            IJwtGenerator jwtGenerator,
            IConfiguration configuration,
            ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IFileStorage fileStorage)
        {
            _env = env;
            _seminarQueriesRepository = seminarQueriesRepository;
            _seminarCommandRepository = seminarCommandRepository;
            _roomCommandRepository = roomCommandRepository;
            _userQueryRepository = userQueryRepository;
            _jwtGenerator = jwtGenerator;
            _configuration = configuration;
            _fileStorage = fileStorage;
        }

        [HttpPost("Add")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Add([FromBody] AddSeminar command)
        {
            return await Create<AddSeminar, string>(command);
        }

        [HttpPut("Update")]
        [HttpPost("Update")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Update([FromBody] UpdateSeminar command)
        {
            return await Edit<UpdateSeminar, string>(command);
        }

        [HttpDelete("Delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Delete([FromQuery] long seminarId)
            => await Edit<DeleteSeminarCommand, string>(new DeleteSeminarCommand { SeminarId = seminarId });

        /// <summary>آپلود تصویر و ویدیو سمینار به msg (public/private) و به‌روزرسانی ThumbnailUrl و VideoUrl.</summary>
        [HttpPost("UploadMedia")]
        [ApiExplorerSettings(IgnoreApi = true)] // Swashbuckle cannot document multipart IFormFile parameters
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UploadMedia(
            [FromForm] long seminarId,
            IFormFile? thumbnailFile,
            IFormFile? videoFile,
            IFormFile? recordingFile,
            [FromForm] string? mediaKind = null)
        {
            string? thumbnailUrl = null;
            string? videoUrl = null;
            string? recordingVideoUrl = null;
            var isRecording = string.Equals(mediaKind, "recording", StringComparison.OrdinalIgnoreCase) || recordingFile != null;

            if (thumbnailFile is { Length: > 0 })
            {
                var ext = Path.GetExtension(thumbnailFile.FileName);
                var key = $"seminars/image/{Guid.NewGuid():N}{ext}";
                await using var stream = thumbnailFile.OpenReadStream();
                var stored = await _fileStorage.PutAsync(
                    key,
                    stream,
                    string.IsNullOrWhiteSpace(thumbnailFile.ContentType) ? "image/jpeg" : thumbnailFile.ContentType,
                    ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Public);
                thumbnailUrl = ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver.ToDbStoredPath(stored);
            }

            var uploadFile = isRecording ? recordingFile : videoFile;
            if (uploadFile is { Length: > 0 })
            {
                var videoExt = Path.GetExtension(uploadFile.FileName);
                if (isRecording)
                {
                    // Recordings stay private until served via signed stream URL.
                    var key = $"seminars/recordings/{Guid.NewGuid():N}{videoExt}";
                    await using var stream = uploadFile.OpenReadStream();
                    var stored = await _fileStorage.PutAsync(
                        key,
                        stream,
                        string.IsNullOrWhiteSpace(uploadFile.ContentType) ? "video/mp4" : uploadFile.ContentType,
                        ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Private);
                    recordingVideoUrl = stored.ObjectKey;
                }
                else
                {
                    var key = $"seminars/video/{Guid.NewGuid():N}{videoExt}";
                    await using var stream = uploadFile.OpenReadStream();
                    var stored = await _fileStorage.PutAsync(
                        key,
                        stream,
                        string.IsNullOrWhiteSpace(uploadFile.ContentType) ? "video/mp4" : uploadFile.ContentType,
                        ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Public);
                    videoUrl = ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver.ToDbStoredPath(stored);
                }
            }

            if (string.IsNullOrEmpty(thumbnailUrl) && string.IsNullOrEmpty(videoUrl) && string.IsNullOrEmpty(recordingVideoUrl))
                return BadRequest(new { message = "At least one media file is required." });

            var command = new UpdateSeminarMedia
            {
                SeminarId = seminarId,
                ThumbnailUrl = thumbnailUrl,
                VideoUrl = videoUrl,
                RecordingVideoUrl = recordingVideoUrl,
                MediaKind = isRecording ? "recording" : "intro"
            };
            var result = await CommandDispatcher.Send<UpdateSeminarMedia, string>(command);
            if (result.Status == ApplicationServiceStatus.Ok)
                return StatusCode((int)HttpStatusCode.OK, result.Data);
            if (result.Status == ApplicationServiceStatus.NotFound)
                return StatusCode((int)HttpStatusCode.NotFound, result.Messages);
            return BadRequest(result.Messages);
        }

        [HttpPut("UpdateStatus")]
        [HttpPost("UpdateStatus")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateSeminarStatus command)
            => await Edit<UpdateSeminarStatus, string>(command);

        [HttpGet("StreamIntro")]
        public async Task<IActionResult> StreamIntro([FromQuery] long seminarId)
        {
            var seminar = await _seminarCommandRepository.GetAsync(seminarId);
            if (seminar == null || string.IsNullOrWhiteSpace(seminar.VideoUrl))
                return NotFound();
            if (!seminar.IsPublic || seminar.Status is SeminarStatus.Draft or SeminarStatus.Cancelled)
                return NotFound();
            return await ServeStoredFileAsync(seminar.VideoUrl, preferPublic: true);
        }

        [HttpGet("StreamRecording")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> StreamRecording([FromQuery] long seminarId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var seminar = await _seminarCommandRepository.GetAsync(seminarId);
            if (seminar == null || string.IsNullOrWhiteSpace(seminar.RecordingVideoUrl))
                return NotFound();

            if (!seminar.CanUserEnter(userId))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You must register and pay (if required) to watch this recording." });

            return await ServeStoredFileAsync(seminar.RecordingVideoUrl, preferPublic: false);
        }

        private async Task<IActionResult> ServeStoredFileAsync(string relativeUrl, bool preferPublic)
        {
            var keyOrUrl = relativeUrl.Replace('\\', '/').Trim();
            string objectKey;
            if (keyOrUrl.StartsWith("private/", StringComparison.OrdinalIgnoreCase)
                || keyOrUrl.StartsWith("public/", StringComparison.OrdinalIgnoreCase)
                || keyOrUrl.StartsWith("drm/", StringComparison.OrdinalIgnoreCase))
            {
                objectKey = keyOrUrl.TrimStart('/');
            }
            else
            {
                objectKey = _fileStorage.ToObjectKey(
                    keyOrUrl,
                    preferPublic
                        ? ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Public
                        : ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Private);
            }

            if (await _fileStorage.ExistsAsync(objectKey))
            {
                if (objectKey.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
                {
                    var publicUrl = _fileStorage.GetPublicUrl(objectKey);
                    if (publicUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                        return Redirect(publicUrl);
                }
                else
                {
                    var signed = _fileStorage.CreateSignedReadUrl(objectKey);
                    if (signed.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                        return Redirect(signed);
                }
            }

            return ServeWwwrootFile(relativeUrl);
        }

        private IActionResult ServeWwwrootFile(string relativeUrl)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var relative = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            if (relative.StartsWith("public" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                relative = relative[("public" + Path.DirectorySeparatorChar).Length..];
            if (relative.StartsWith("private" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                relative = relative[("private" + Path.DirectorySeparatorChar).Length..];

            var fullPath = Path.GetFullPath(Path.Combine(webRoot, relative));
            if (!fullPath.StartsWith(Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(fullPath))
                return NotFound();

            var contentType = "application/octet-stream";
            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            if (ext is ".mp4") contentType = "video/mp4";
            else if (ext is ".webm") contentType = "video/webm";
            else if (ext is ".mov") contentType = "video/quicktime";

            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }

        [HttpPost("Register")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Register([FromBody] RegisterSeminarCommand command)
        {
            return await Create<RegisterSeminarCommand, string>(command);
        }

        /// <summary>ثبت‌نام کاربر/دانشجو در سمینار توسط ادمین</summary>
        [HttpPost("RegisterUser")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterUserForSeminarCommand command)
        {
            return await Create<RegisterUserForSeminarCommand, string>(command);
        }

        [HttpPost("add-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddComment([FromBody] AddSeminarComment command)
        {
            return await Create<AddSeminarComment, string>(command);
        }

        [HttpPut("approve-comment")]
        [HttpPost("approve-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApproveComment([FromBody] ApproveSeminarCommentCommand command)
        {
            return await Edit<ApproveSeminarCommentCommand, string>(command);
        }

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById([FromQuery] GetSeminarByIdQuery query)
            => await Query<GetSeminarByIdQuery, SeminarQri>(query);

        [HttpGet("Search")]
        public async Task<IActionResult> Search([FromQuery] SearchSeminarByInputValueQuery query)
            => await Query<SearchSeminarByInputValueQuery, PagedData<SearchSeminarQri>>(query);

        [HttpGet("GetRegistrations")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetRegistrations([FromQuery] GetSeminarRegistrationsQuery query)
            => await Query<GetSeminarRegistrationsQuery, PagedData<SeminarRegistrationQri>>(query);

        [HttpGet("GetAllRegistrations")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetAllRegistrations([FromQuery] GetAllSeminarRegistrationsQuery query)
            => await Query<GetAllSeminarRegistrationsQuery, PagedData<SeminarRegistrationWithSeminarQri>>(query);

        /// <summary>سمینارهای ثبت‌نام‌شدهٔ کاربر جاری به‌همراه لینک اتاق و نام کاربری ورود</summary>
        [HttpGet("GetMyRegisteredSeminars")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyRegisteredSeminars()
            => await Query<GetMyRegisteredSeminarsQuery, List<MyRegisteredSeminarQri>>(new GetMyRegisteredSeminarsQuery());

        [HttpGet("get-comments")]
        public async Task<IActionResult> GetComments([FromQuery] GetAllCommentsBySeminarIdQuery query)
            => await Query<GetAllCommentsBySeminarIdQuery, PagedData<GetAllCommentsBySeminarIdQri>>(query);

        [HttpGet("CanUserEnter")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CanUserEnter([FromQuery] CanUserEnterSeminarQuery query)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });
            query.UserId = userId;
            return await Query<CanUserEnterSeminarQuery, CanUserEnterSeminarQri>(query);
        }

        [HttpPost("EnterRoom")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> EnterRoom([FromBody] EnterSeminarRoomRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });

            var gate = await _seminarQueriesRepository.CanUserEnterSeminarAsync(new CanUserEnterSeminarQuery
            {
                SeminarId = request.SeminarId,
                UserId = userId
            });

            if (!gate.CanEnter)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = gate.Reason ?? "You cannot enter this seminar room." });

            var seminar = await _seminarQueriesRepository.GetSeminarByIdExecuteAsync(new GetSeminarByIdQuery { SeminarId = request.SeminarId });
            if (seminar?.RoomId == null)
                return NotFound(new { message = "No online room is assigned to this seminar." });

            var user = await _userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
                return BadRequest(new { message = "The current user does not have a valid email for room login." });

            var room = await _roomCommandRepository.GetWithRoomUsersAsync(seminar.RoomId.Value);
            if (room == null)
                return NotFound(new { message = "Online room was not found." });

            var email = user.Email.Trim();
            var roomUser = room.FindRoomUserForLogin(email);

            if (roomUser == null)
            {
                var firstName = string.IsNullOrWhiteSpace(user.FirstName) ? user.UserName ?? "Student" : user.FirstName;
                var lastName = string.IsNullOrWhiteSpace(user.LastName) ? "--" : user.LastName;
                room.AddUserRoom(firstName, lastName, email, GenerateStrongPassword());
                await _roomCommandRepository.CommitAsync();
                room = await _roomCommandRepository.GetWithRoomUsersAsync(seminar.RoomId.Value);
                roomUser = room?.FindRoomUserForLogin(email);
            }

            if (roomUser == null)
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Room access could not be prepared for this user." });

            if (roomUser.IsBlocked)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "This room seat is blocked." });

            var token = _jwtGenerator.GenerateJwtToken(roomUser);
            var dashboardOrigin = _configuration["RoomDashboard:BaseUrl"]?.Trim() ?? "https://admin-dashboard.arkasoftware.ir";
            var roomLink = RoomEntryLinkBuilder.Normalize(
                seminar.RoomLink ?? gate.EntryLink,
                room.Slug,
                dashboardOrigin);

            return Ok(new EnterSeminarRoomResponse(
                roomLink,
                new
                {
                    token,
                    userId = roomUser.Id.ToString(),
                    Role = "student",
                    userName = roomUser.UserName?.Value ?? email,
                    displayName = $"{roomUser.Name?.FirstName} {roomUser.Name?.LastName}".Trim(),
                    avatarUrl = string.IsNullOrWhiteSpace(roomUser.PhotoUrl) ? null : roomUser.PhotoUrl,
                    email
                }));
        }

        [HttpPost("AddToFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddToFavorites([FromBody] AddSeminarToFavoritesCommand command)
            => await Create<AddSeminarToFavoritesCommand, string>(command);

        [HttpPost("RemoveFromFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RemoveFromFavorites([FromBody] RemoveSeminarFromFavoritesCommand command)
            => await Create<RemoveSeminarFromFavoritesCommand, string>(command);

        [HttpGet("GetMyFavoriteSeminarIds")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteSeminarIds()
            => await Query<GetMyFavoriteSeminarIdsQuery, List<long>>(new GetMyFavoriteSeminarIdsQuery());

        [HttpGet("GetMyFavoriteSeminars")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteSeminars()
            => await Query<GetMyFavoriteSeminarsQuery, List<GetMyFavoriteSeminarQri>>(new GetMyFavoriteSeminarsQuery());

        private bool TryGetCurrentUserId(out long userId)
        {
            var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(claimValue, out userId);
        }

        private static string GenerateStrongPassword(int length = 14)
        {
            const string chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
            var bytes = new byte[length];
            RandomNumberGenerator.Fill(bytes);
            var result = new char[length];
            for (var i = 0; i < length; i++)
                result[i] = chars[bytes[i] % chars.Length];
            return new string(result);
        }
    }

    public sealed class EnterSeminarRoomRequest
    {
        public long SeminarId { get; set; }
    }

    public sealed record EnterSeminarRoomResponse(string? RoomLink, object UserData);
}
