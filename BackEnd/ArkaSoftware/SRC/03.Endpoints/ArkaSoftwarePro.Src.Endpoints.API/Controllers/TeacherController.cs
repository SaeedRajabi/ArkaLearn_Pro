using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddTeacher;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddPromotionalVideoComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeletePromotionalVideo;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.DeleteTeacherBook;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherBook;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBookBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RecordPromotionalVideoView;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePromotionalVideo;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.TogglePromotionalVideoLike;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherContent;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SetTeacherAccountStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherContent;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherReviewChanges;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherAdvertisement;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveAdvertisementMonetizationSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RedeemXpFreeMonth;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ManualBumpAdvertisement;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RequestTeacherPayout;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ProcessTeacherPayout;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePlatformPayoutBankSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePaymentGatewaySettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherPayoutBankInfo;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.BackfillTeacherCourseSales;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementTariffs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationAdmin;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyAdvertisementPlan;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetManualBumpCaptcha;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherXpSummary;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsSummary;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsChart;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherCourseSales;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherPayouts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPlatformPayoutBankSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPaymentGatewaySettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutBankInfo;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutQueue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementAutoBumpPackages;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationRevenue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.HasAdvertisementContactUnlock;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SubmitTeacherProfileForReview;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherProfiles;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherAdvertisement;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPromotionalVideos;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherResume;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.FollowTeacher;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UnfollowTeacher;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherTeachingCategories;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherAdvertisements;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeachers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchUserSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAdvertisementPlan;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAutoBumpPlan;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    [ApiController]
    public class TeacherController : BaseController
    {
        private const long MaxPromotionalVideoBytes = 50L * 1024 * 1024;
        private const long MaxPromotionalThumbnailBytes = 5L * 1024 * 1024;
        private const long MaxBookFileBytes = 50L * 1024 * 1024;
        private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".mp4", ".webm", ".mov", ".avi", ".mkv"
        };
        private static readonly HashSet<string> AllowedThumbnailExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };
        private static readonly HashSet<string> AllowedBookFileExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".epub", ".doc", ".docx", ".djvu", ".zip"
        };
        private static readonly HashSet<string> AllowedResumeExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf"
        };

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UploadPromotionalVideo")]
        [RequestSizeLimit(MaxPromotionalVideoBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxPromotionalVideoBytes)]
        public async Task<IActionResult> UploadPromotionalVideo(
            IFormFile file,
            [FromServices] FileStoragePathSaver pathSaver,
            [FromServices] ITeacherQueryRepository teacherQueryRepository)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            if (file.Length > MaxPromotionalVideoBytes)
                return BadRequest(new { message = "Video must be 50 MB or smaller." });

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedVideoExtensions.Contains(ext))
                return BadRequest(new { message = "Unsupported video format." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("nameid")?.Value;
            if (!long.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized();

            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
            var url = await pathSaver.SavePublicAsync(file, $"videos/teachers/{folderName}");
            return Ok(new { url });
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UploadPromotionalVideoThumbnail")]
        [RequestSizeLimit(MaxPromotionalThumbnailBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxPromotionalThumbnailBytes)]
        public async Task<IActionResult> UploadPromotionalVideoThumbnail(
            IFormFile file,
            [FromServices] FileStoragePathSaver pathSaver,
            [FromServices] ITeacherQueryRepository teacherQueryRepository)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            if (file.Length > MaxPromotionalThumbnailBytes)
                return BadRequest(new { message = "Thumbnail must be 5 MB or smaller." });

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedThumbnailExtensions.Contains(ext))
                return BadRequest(new { message = "Unsupported image format. Use JPG, PNG, or WebP." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("nameid")?.Value;
            if (!long.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized();

            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
            var url = await pathSaver.SavePublicAsync(file, $"videos/teachers/{folderName}/thumbnails");
            return Ok(new { url });
        }

        [HttpGet("GetPromotionalVideos")]
        public Task<IActionResult> GetPromotionalVideos([FromQuery] GetTeacherPromotionalVideosQuery query)
            => Query<GetTeacherPromotionalVideosQuery, List<TeacherPromotionalVideoPublicQri>>(query);

        [HttpGet("GetTeacherBooks")]
        public Task<IActionResult> GetTeacherBooks([FromQuery] GetTeacherBooksQuery query)
            => Query<GetTeacherBooksQuery, List<TeacherBookPublicQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyBooks")]
        public Task<IActionResult> GetMyBooks([FromQuery] GetTeacherBooksQuery query)
        {
            query.ForEdit = true;
            return Query<GetTeacherBooksQuery, List<TeacherBookPublicQri>>(query);
        }

        [HttpGet("SearchBooks")]
        public Task<IActionResult> SearchBooks([FromQuery] SearchTeacherBooksQuery query)
            => Query<SearchTeacherBooksQuery, PagedData<TeacherBookListItemQri>>(query);

        [HttpGet("GetBookBySlug")]
        public Task<IActionResult> GetBookBySlug([FromQuery] GetTeacherBookBySlugQuery query)
            => Query<GetTeacherBookBySlugQuery, TeacherBookPublicQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("SaveTeacherBook")]
        [HttpPost("SaveTeacherBook")]
        public Task<IActionResult> SaveTeacherBook([FromBody] SaveTeacherBookCommand command)
            => Edit<SaveTeacherBookCommand, long>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpDelete("DeleteTeacherBook")]
        public Task<IActionResult> DeleteTeacherBook([FromBody] DeleteTeacherBookCommand command)
            => Delete<DeleteTeacherBookCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UploadBookCover")]
        [RequestSizeLimit(MaxPromotionalThumbnailBytes)]
        public async Task<IActionResult> UploadBookCover(
            IFormFile file,
            [FromServices] FileStoragePathSaver pathSaver,
            [FromServices] ITeacherQueryRepository teacherQueryRepository)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });
            if (file.Length > MaxPromotionalThumbnailBytes)
                return BadRequest(new { message = "Image must be 5 MB or smaller." });
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedThumbnailExtensions.Contains(ext))
                return BadRequest(new { message = "Unsupported image format." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("nameid")?.Value;
            if (!long.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized();

            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
            var url = await pathSaver.SavePublicAsync(file, $"images/books/{folderName}");
            return Ok(new { url });
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UploadBookFile")]
        [RequestSizeLimit(MaxBookFileBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxBookFileBytes)]
        public async Task<IActionResult> UploadBookFile(
            IFormFile file,
            [FromServices] FileStoragePathSaver pathSaver,
            [FromServices] ITeacherQueryRepository teacherQueryRepository)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });
            if (file.Length > MaxBookFileBytes)
                return BadRequest(new { message = "Book file must be 50 MB or smaller." });
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedBookFileExtensions.Contains(ext))
                return BadRequest(new { message = "Unsupported book format. Use PDF, EPUB, Word (.doc, .docx), DJVU or ZIP." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("nameid")?.Value;
            if (!long.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized();

            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
            var safeOriginal = Path.GetFileName(file.FileName);
            var url = await pathSaver.SavePublicAsync(file, $"files/books/{folderName}");
            return Ok(new { url, fileName = safeOriginal });
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UploadResumePdf")]
        [RequestSizeLimit(MaxBookFileBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxBookFileBytes)]
        public async Task<IActionResult> UploadResumePdf(
            IFormFile file,
            [FromServices] FileStoragePathSaver pathSaver,
            [FromServices] ITeacherQueryRepository teacherQueryRepository)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });
            if (file.Length > MaxBookFileBytes)
                return BadRequest(new { message = "Resume PDF must be 50 MB or smaller." });
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedResumeExtensions.Contains(ext))
                return BadRequest(new { message = "Resume must be a PDF file." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value
                ?? User.FindFirst("nameid")?.Value;
            if (!long.TryParse(userIdClaim, out var userId) || userId <= 0)
                return Unauthorized();

            var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            var folderName = teacherId is > 0 ? teacherId.Value.ToString() : $"user-{userId}";
            var safeOriginal = Path.GetFileName(file.FileName);
            var url = await pathSaver.SavePublicAsync(file, $"files/resumes/{folderName}");
            return Ok(new { url, fileName = safeOriginal });
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("SaveResume")]
        public Task<IActionResult> SaveResume([FromBody] SaveTeacherResumeCommand command)
            => Create<SaveTeacherResumeCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyPromotionalVideos")]
        public Task<IActionResult> GetMyPromotionalVideos([FromQuery] GetTeacherPromotionalVideosQuery query)
        {
            query.ForEdit = true;
            return Query<GetTeacherPromotionalVideosQuery, List<TeacherPromotionalVideoPublicQri>>(query);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("SavePromotionalVideo")]
        [HttpPost("SavePromotionalVideo")]
        public Task<IActionResult> SavePromotionalVideo([FromBody] SavePromotionalVideoCommand command)
            => Edit<SavePromotionalVideoCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpDelete("DeletePromotionalVideo")]
        public Task<IActionResult> DeletePromotionalVideo([FromBody] DeletePromotionalVideoCommand command)
            => Delete<DeletePromotionalVideoCommand, string>(command);

        [HttpPost("RecordPromotionalVideoView")]
        public Task<IActionResult> RecordPromotionalVideoView([FromBody] RecordPromotionalVideoViewCommand command)
            => Create<RecordPromotionalVideoViewCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("TogglePromotionalVideoLike")]
        public Task<IActionResult> TogglePromotionalVideoLike([FromBody] TogglePromotionalVideoLikeCommand command)
            => Create<TogglePromotionalVideoLikeCommand, PromotionalVideoLikeResult>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("AddPromotionalVideoComment")]
        public Task<IActionResult> AddPromotionalVideoComment([FromBody] AddPromotionalVideoCommentCommand command)
            => Create<AddPromotionalVideoCommentCommand, string>(command);

        [HttpGet("GetPromotionalVideoComments")]
        public Task<IActionResult> GetPromotionalVideoComments([FromQuery] GetPromotionalVideoCommentsQuery query)
            => Query<GetPromotionalVideoCommentsQuery, List<PromotionalVideoCommentQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("Add")]
        public Task<IActionResult> AddTeacher([FromBody] AddTeacherCommand teacherCommand)
        {
            return Create<AddTeacherCommand, string>(teacherCommand);
        }

        [HttpGet("GetProfile")]
        public Task<IActionResult> GetProfile([FromQuery] GetTeacherProfileQuery query)
        {
            if (TryGetCurrentUserId(out var userId))
                query.ViewerUserId = userId;
            return Query<GetTeacherProfileQuery, TeacherProfileQri>(query);
        }

        [HttpGet("Search")]
        public Task<IActionResult> Search([FromQuery] SearchTeachersQuery query)
        {
            if (TryGetCurrentUserId(out var userId))
                query.ViewerUserId = userId;
            if (User.IsDashboardAdminRole())
                query.ForAdmin = true;
            return Query<SearchTeachersQuery, PagedData<SearchTeacherQri>>(query);
        }

        [HttpGet("SearchUserCourses")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> SearchUserCourses([FromQuery] SearchTeacherCoursesQuery query)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<SearchTeacherCoursesQuery, PagedData<SearchCourseQri>>(query);
        }

        [HttpGet("SearchUserSeminars")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> SearchUserSeminars([FromQuery] SearchUserSeminarsQuery query)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<SearchUserSeminarsQuery, PagedData<SearchSeminarQri>>(query);
        }

        [HttpPost("AdminGrantAdvertisementPlan")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> AdminGrantAdvertisementPlan([FromBody] AdminGrantTeacherAdvertisementPlanCommand command)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Edit<AdminGrantTeacherAdvertisementPlanCommand, string>(command);
        }

        [HttpPost("AdminGrantAutoBumpPlan")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> AdminGrantAutoBumpPlan([FromBody] AdminGrantTeacherAutoBumpPlanCommand command)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Edit<AdminGrantTeacherAutoBumpPlanCommand, string>(command);
        }

        [HttpGet("GetTeachingCategories")]
        public Task<IActionResult> GetTeachingCategories([FromQuery] GetTeacherTeachingCategoriesQuery query)
            => Query<GetTeacherTeachingCategoriesQuery, List<TeacherTeachingCategoryItemQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("UpdateProfile")]
        [HttpPost("UpdateProfile")]
        public Task<IActionResult> UpdateProfile([FromBody] UpdateTeacherProfileCommand command)
            => Edit<UpdateTeacherProfileCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("SubmitForReview")]
        public Task<IActionResult> SubmitForReview([FromBody] SubmitTeacherProfileForReviewCommand command)
            => Edit<SubmitTeacherProfileForReviewCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetPendingProfiles")]
        public Task<IActionResult> GetPendingProfiles([FromQuery] GetPendingTeacherProfilesQuery query)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Query<GetPendingTeacherProfilesQuery, List<PendingTeacherProfileQri>>(query);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("ReviewProfile")]
        public Task<IActionResult> ReviewProfile([FromBody] ReviewTeacherProfileCommand command)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Edit<ReviewTeacherProfileCommand, string>(command);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetPendingContent")]
        public Task<IActionResult> GetPendingContent([FromQuery] GetPendingTeacherContentQuery query)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Query<GetPendingTeacherContentQuery, List<PendingTeacherContentQri>>(query);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetReviewChanges")]
        public Task<IActionResult> GetReviewChanges([FromQuery] GetTeacherReviewChangesQuery query)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Query<GetTeacherReviewChangesQuery, TeacherReviewChangesQri>(query);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("ReviewContent")]
        public Task<IActionResult> ReviewContent([FromBody] ReviewTeacherContentCommand command)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Edit<ReviewTeacherContentCommand, string>(command);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("SetAccountStatus")]
        public Task<IActionResult> SetAccountStatus([FromBody] SetTeacherAccountStatusCommand command)
        {
            if (!User.IsDashboardAdminRole())
                return Task.FromResult<IActionResult>(Forbid());
            return Edit<SetTeacherAccountStatusCommand, string>(command);
        }

        [HttpGet("GetAdvertisement")]
        public Task<IActionResult> GetAdvertisement([FromQuery] GetTeacherAdvertisementQuery query)
        {
            if (TryGetCurrentUserId(out var userId))
                query.ViewerUserId = userId;
            return Query<GetTeacherAdvertisementQuery, TeacherAdvertisementQri>(query);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("FollowTeacher")]
        public async Task<IActionResult> FollowTeacher([FromBody] FollowTeacherCommand command)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });
            command.UserId = userId;
            return await Create<FollowTeacherCommand, string>(command);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("UnfollowTeacher")]
        public async Task<IActionResult> UnfollowTeacher([FromBody] UnfollowTeacherCommand command)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized(new { message = "User is not authenticated." });
            command.UserId = userId;
            return await Create<UnfollowTeacherCommand, string>(command);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("SaveAdvertisement")]
        [HttpPost("SaveAdvertisement")]
        public Task<IActionResult> SaveAdvertisement([FromBody] SaveTeacherAdvertisementCommand command)
            => Edit<SaveTeacherAdvertisementCommand, string>(command);

        [HttpGet("SearchAdvertisements")]
        public Task<IActionResult> SearchAdvertisements([FromQuery] SearchTeacherAdvertisementsQuery query)
            => Query<SearchTeacherAdvertisementsQuery, PagedData<TeacherAdvertisementListItemQri>>(query);

        [HttpGet("GetAdvertisementTariffs")]
        public Task<IActionResult> GetAdvertisementTariffs([FromQuery] GetAdvertisementTariffsQuery query)
            => Query<GetAdvertisementTariffsQuery, List<AdvertisementTariffQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetAdvertisementMonetizationAdmin")]
        public Task<IActionResult> GetAdvertisementMonetizationAdmin([FromQuery] GetAdvertisementMonetizationAdminQuery query)
            => Query<GetAdvertisementMonetizationAdminQuery, AdvertisementMonetizationAdminQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPut("SaveAdvertisementMonetizationSettings")]
        [HttpPost("SaveAdvertisementMonetizationSettings")]
        public Task<IActionResult> SaveAdvertisementMonetizationSettings([FromBody] SaveAdvertisementMonetizationSettingsCommand command)
            => Edit<SaveAdvertisementMonetizationSettingsCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyAdvertisementPlan")]
        public Task<IActionResult> GetMyAdvertisementPlan([FromQuery] GetMyAdvertisementPlanQuery query)
            => Query<GetMyAdvertisementPlanQuery, MyAdvertisementPlanQri>(query);

        [HttpGet("GetMyTeacherXpSummary")]
        public Task<IActionResult> GetMyTeacherXpSummary([FromQuery] GetMyTeacherXpSummaryQuery query)
            => Query<GetMyTeacherXpSummaryQuery, MyTeacherXpSummaryQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("RedeemXpFreeMonth")]
        public Task<IActionResult> RedeemXpFreeMonth([FromBody] RedeemXpFreeMonthCommand command)
            => Edit<RedeemXpFreeMonthCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetManualBumpCaptcha")]
        public Task<IActionResult> GetManualBumpCaptcha([FromQuery] GetManualBumpCaptchaQuery query)
            => Query<GetManualBumpCaptchaQuery, ManualBumpCaptchaQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("ManualBumpAdvertisement")]
        public Task<IActionResult> ManualBumpAdvertisement([FromBody] ManualBumpAdvertisementCommand command)
            => Edit<ManualBumpAdvertisementCommand, ManualBumpAdvertisementResultQri>(command);

        /// <summary>Public probe: anonymous viewers get locked status; signed-in viewers get unlock state.</summary>
        [HttpGet("HasAdvertisementContactUnlock")]
        public Task<IActionResult> HasAdvertisementContactUnlock([FromQuery] HasAdvertisementContactUnlockQuery query)
            => Query<HasAdvertisementContactUnlockQuery, ContactUnlockStatusQri>(query);

        [HttpGet("GetAdvertisementAutoBumpPackages")]
        public Task<IActionResult> GetAdvertisementAutoBumpPackages([FromQuery] GetAdvertisementAutoBumpPackagesQuery query)
            => Query<GetAdvertisementAutoBumpPackagesQuery, List<AdvertisementAutoBumpPackageQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetAdvertisementMonetizationRevenue")]
        public Task<IActionResult> GetAdvertisementMonetizationRevenue([FromQuery] GetAdvertisementMonetizationRevenueQuery query)
            => Query<GetAdvertisementMonetizationRevenueQuery, AdvertisementMonetizationRevenueReportQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyTeacherEarningsSummary")]
        public Task<IActionResult> GetMyTeacherEarningsSummary([FromQuery] GetMyTeacherEarningsSummaryQuery query)
            => Query<GetMyTeacherEarningsSummaryQuery, MyTeacherEarningsSummaryQri>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyTeacherEarningsChart")]
        public Task<IActionResult> GetMyTeacherEarningsChart([FromQuery] GetMyTeacherEarningsChartQuery query)
            => Query<GetMyTeacherEarningsChartQuery, List<TeacherEarningsChartPointQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyTeacherCourseSales")]
        public Task<IActionResult> GetMyTeacherCourseSales([FromQuery] GetMyTeacherCourseSalesQuery query)
            => Query<GetMyTeacherCourseSalesQuery, List<TeacherCourseSaleQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetMyTeacherPayouts")]
        public Task<IActionResult> GetMyTeacherPayouts([FromQuery] GetMyTeacherPayoutsQuery query)
            => Query<GetMyTeacherPayoutsQuery, List<TeacherPayoutQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("RequestTeacherPayout")]
        public Task<IActionResult> RequestTeacherPayout([FromBody] RequestTeacherPayoutCommand command)
            => Edit<RequestTeacherPayoutCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetTeacherPayoutQueue")]
        public Task<IActionResult> GetTeacherPayoutQueue([FromQuery] GetTeacherPayoutQueueQuery query)
            => Query<GetTeacherPayoutQueueQuery, List<AdminTeacherPayoutQri>>(query);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("ProcessTeacherPayout")]
        public Task<IActionResult> ProcessTeacherPayout([FromBody] ProcessTeacherPayoutCommand command)
            => Edit<ProcessTeacherPayoutCommand, string>(command);

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpGet("GetPayoutBankInfo")]
        public Task<IActionResult> GetPayoutBankInfo()
            => Query<GetTeacherPayoutBankInfoQuery, TeacherPayoutBankInfoQri>(new GetTeacherPayoutBankInfoQuery());

        [HttpPost("UpdatePayoutBankInfo")]
        public async Task<IActionResult> UpdatePayoutBankInfo([FromBody] UpdateTeacherPayoutBankInfoCommand command)
        {
            if (!TryGetCurrentUserId(out var userId)) return Unauthorized();
            command.UserId = userId;
            return await Edit<UpdateTeacherPayoutBankInfoCommand, string>(command);
        }

        [HttpGet("GetPlatformPayoutBankSettings")]
        public Task<IActionResult> GetPlatformPayoutBankSettings()
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<GetPlatformPayoutBankSettingsQuery, PlatformPayoutBankSettingsQri>(new GetPlatformPayoutBankSettingsQuery());
        }

        [HttpPost("SavePlatformPayoutBankSettings")]
        public Task<IActionResult> SavePlatformPayoutBankSettings([FromBody] SavePlatformPayoutBankSettingsCommand command)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Edit<SavePlatformPayoutBankSettingsCommand, string>(command);
        }

        [HttpGet("GetPaymentGatewaySettings")]
        public Task<IActionResult> GetPaymentGatewaySettings()
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Query<GetPaymentGatewaySettingsQuery, PaymentGatewaySettingsQri>(new GetPaymentGatewaySettingsQuery());
        }

        [HttpPost("SavePaymentGatewaySettings")]
        public Task<IActionResult> SavePaymentGatewaySettings([FromBody] SavePaymentGatewaySettingsCommand command)
        {
            if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
            return Edit<SavePaymentGatewaySettingsCommand, string>(command);
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        [HttpPost("BackfillTeacherCourseSales")]
        public Task<IActionResult> BackfillTeacherCourseSales([FromBody] BackfillTeacherCourseSalesCommand command)
            => Edit<BackfillTeacherCourseSalesCommand, BackfillTeacherCourseSalesResult>(command);

        private bool TryGetCurrentUserId(out long userId)
        {
            var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(claimValue, out userId);
        }
    }
}
