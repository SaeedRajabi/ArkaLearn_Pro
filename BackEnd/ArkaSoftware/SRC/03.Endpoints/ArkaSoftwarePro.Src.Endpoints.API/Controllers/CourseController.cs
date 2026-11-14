using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.IO.Compression;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ApproveCourseEnrollment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ApproveCourseComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourseComment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.LikeCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseSections;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourseTitleImage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.Favorites;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RegisterFreeCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RemoveTeacherStudent;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReportLessonWatchProgress;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReviewCourseModeration;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetPendingCourseModeration;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCartRecommendations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourseIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherEnrolledStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers
{
    [Route("api/Service/[controller]")]
    public class CourseController : BaseController
    {
        private readonly IWebHostEnvironment _env;
        private readonly ICourseQueriesRepository _courseQueriesRepository;
        private readonly ICourseCommandRepository _courseCommandRepository;
        private readonly ITeacherQueryRepository _teacherQueryRepository;
        private readonly IConfiguration _configuration;

        public CourseController(
            IWebHostEnvironment env,
            ICourseQueriesRepository courseQueriesRepository,
            ICourseCommandRepository courseCommandRepository,
            ITeacherQueryRepository teacherQueryRepository,
            IConfiguration configuration)
        {
            _env = env;
            _courseQueriesRepository = courseQueriesRepository;
            _courseCommandRepository = courseCommandRepository;
            _teacherQueryRepository = teacherQueryRepository;
            _configuration = configuration;
        }

        [HttpPost]
        [Route("Add")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Post([FromForm] AddCourse course)
        {
            return await Create<AddCourse, string>(course);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="courseSection"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("AddSection")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> AddCourseSection(AddCourseSection courseSection)
        {
            return await Create<AddCourseSection, string>(courseSection);
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="courseComment"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("add-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]

        public async Task<IActionResult> AddCourseComment(AddCourseComment courseComment)
        {
            return await Create<AddCourseComment, string>(courseComment);
        }

        [HttpPut("approve-comment")]
        [HttpPost("approve-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApproveCourseComment(ApproveCourseCommentCommand command)
            => await Edit<ApproveCourseCommentCommand, string>(command);

        [HttpDelete("delete-comment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteCourseComment(DeleteCourseCommentCommand command)
            => await Delete<DeleteCourseCommentCommand, string>(command);

        [HttpPost]
        [Route("LikeComment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> LikeCourseComment(LikeCourseComment command)
        {
            return await Create<LikeCourseComment, string>(command);
        }


        [HttpPut]
        [Route("UpdateTitleImage")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateCourseTitleImage([FromForm]UpdateCourseTitleImageCommand titleImageCommand)
        {
            return await Edit<UpdateCourseTitleImageCommand , string>(titleImageCommand);
        }

        [HttpPut]
        [HttpPost]
        [Route("Update")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateCourse([FromForm] UpdateCourse command)
            => await Edit<UpdateCourse, string>(command);



        [HttpGet("GetById")]
        public async Task<IActionResult> GetCourseById([FromQuery] GetCourseByIdQuery courseQuery)
        {
            if (TryGetCurrentUserId(out var userId))
                courseQuery.ViewerUserId = userId;
            courseQuery.ViewerIsAdmin = IsAdminUser();
            return await Query<GetCourseByIdQuery, CourseQri>(courseQuery);
        }

        /// <summary>
        /// Authenticated owner/admin course detail (includes drafts / pending moderation).
        /// </summary>
        [HttpGet("GetMyCourseById")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyCourseById([FromQuery] GetCourseByIdQuery courseQuery)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            courseQuery.ViewerUserId = userId;
            courseQuery.ViewerIsAdmin = IsAdminUser();
            return await Query<GetCourseByIdQuery, CourseQri>(courseQuery);
        }

        [HttpGet("GetBySlug")]
        public async Task<IActionResult> GetCourseBySlug([FromQuery] GetCourseBySlugQuery courseQuery)
        {
            if (TryGetCurrentUserId(out var userId))
                courseQuery.ViewerUserId = userId;
            return await Query<GetCourseBySlugQuery, CourseQri>(courseQuery);
        }


        [HttpGet("Search")]
        public async Task<IActionResult> SearchCourses([FromQuery] SearchCourseByInputValueQuery courseQuery)
            => await Query<SearchCourseByInputValueQuery, PagedData<SearchCourseQri>>(courseQuery);

        [HttpPost("GetCartRecommendations")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCartRecommendations([FromBody] GetCartRecommendationsQuery query)
            => await Query<GetCartRecommendationsQuery, CartRecommendationsQri>(query);

        [HttpGet("SearchMyCourses")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchMyCourses([FromQuery] SearchTeacherCoursesQuery courseQuery)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            courseQuery.TeacherUserId = userId;
            return await Query<SearchTeacherCoursesQuery, PagedData<SearchCourseQri>>(courseQuery);
        }


        [HttpGet("get-comments")]
        public async Task<IActionResult> GetCourseComments([FromQuery] GetAllCommentsByCourseIdQuery commentsQuery)
            => await Query<GetAllCommentsByCourseIdQuery, PagedData<GetAllCommentsByCourseIdQri>>(commentsQuery);



        [HttpGet("GetAllPopular")]
        public async Task<IActionResult> GetAllPopularCourse([FromQuery] GetAllPopularCourseQuery courseQuery)
             => await Query<GetAllPopularCourseQuery, PagedData<GetAllPopularCourseQri>>(courseQuery);

        
        
        
        [HttpGet("GetMyCourses")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyCourse([FromQuery] GetMyCoursesQuery myCourseQuery)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            myCourseQuery.UserId = userId;
            return await Query<GetMyCoursesQuery, List<GetMyCoursesQri>>(myCourseQuery);
        }

        [HttpGet("GetMyCourseLessonProgress")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyCourseLessonProgress([FromQuery] GetMyCourseLessonProgressQuery query)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            query.UserId = userId;
            return await Query<GetMyCourseLessonProgressQuery, List<LessonWatchProgressQri>>(query);
        }

        [HttpPost("ReportLessonWatchProgress")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ReportLessonWatchProgress([FromBody] ReportLessonWatchProgressCommand command)
            => await Edit<ReportLessonWatchProgressCommand, LessonWatchProgressQri>(command);

        [HttpGet("GetMyEnrolledStudents")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyEnrolledStudents()
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            return await Query<GetTeacherEnrolledStudentsQuery, List<TeacherEnrolledStudentQri>>(
                new GetTeacherEnrolledStudentsQuery { TeacherUserId = userId });
        }

        [HttpGet("GetMyStudents")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyStudents([FromQuery] GetTeacherStudentsQuery query)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            query.TeacherUserId = userId;
            query.NeedTotalCount = true;
            if (query.PageSize <= 0)
                query.PageSize = 8;
            if (query.PageNumber <= 0)
                query.PageNumber = 1;
            return await Query<GetTeacherStudentsQuery, PagedData<TeacherStudentQri>>(query);
        }

        [HttpPost("RemoveMyStudent")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RemoveMyStudent([FromBody] RemoveTeacherStudentCommand command)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            command.TeacherUserId = userId;
            command.PortalUserId = command.PortalUserId;
            return await Edit<RemoveTeacherStudentCommand, bool>(command);
        }

        [HttpGet("GetTeacherComments")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTeacherComments([FromQuery] GetTeacherCourseCommentsQuery query)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();
            query.TeacherUserId = userId;
            return await Query<GetTeacherCourseCommentsQuery, List<GetTeacherCourseCommentsQri>>(query);
        }

        [HttpPost("AddToFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AddToFavorites([FromBody] AddCourseToFavoritesCommand command)
            => await Create<AddCourseToFavoritesCommand, string>(command);

        [HttpPost("RemoveFromFavorites")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RemoveFromFavorites([FromBody] RemoveCourseFromFavoritesCommand command)
            => await Create<RemoveCourseFromFavoritesCommand, string>(command);

        [HttpPost("RegisterFree")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> RegisterFree([FromBody] RegisterFreeCourseCommand command)
            => await Create<RegisterFreeCourseCommand, string>(command);

        [HttpGet("GetMyFavoriteCourseIds")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteCourseIds()
            => await Query<GetMyFavoriteCourseIdsQuery, List<long>>(new GetMyFavoriteCourseIdsQuery());

        [HttpGet("GetMyFavoriteCourses")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyFavoriteCourses()
            => await Query<GetMyFavoriteCoursesQuery, List<GetMyFavoriteCourseQri>>(new GetMyFavoriteCoursesQuery());

        [HttpDelete("Delete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Delete([FromQuery] long courseId)
            => await Edit<DeleteCourseCommand, string>(new DeleteCourseCommand { CourseId = courseId });

        [HttpPost("ApproveEnrollment")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ApproveEnrollment([FromBody] ApproveCourseEnrollmentCommand command)
            => await Edit<ApproveCourseEnrollmentCommand, ApproveCourseEnrollmentResult>(command);

        [HttpGet("StreamLessonVideo")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> StreamLessonVideo([FromQuery] long lessonId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var lesson = await _courseQueriesRepository.GetLessonVideoAccessAsync(lessonId);
            if (lesson == null || string.IsNullOrWhiteSpace(lesson.VideoPath))
                return NotFound();

            if (!await CanAccessCourseVideosAsync(userId, lesson.CourseId))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You must enroll in this course to watch lesson videos." });

            if (!await CanAccessLessonVideoAsync(userId, lesson))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "This lesson is not available yet." });

            return ServeWwwrootFile(lesson.VideoPath, download: false, downloadName: null);
        }

        [HttpGet("DownloadLessonVideo")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DownloadLessonVideo([FromQuery] long lessonId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            var lesson = await _courseQueriesRepository.GetLessonVideoAccessAsync(lessonId);
            if (lesson == null || string.IsNullOrWhiteSpace(lesson.VideoPath))
                return NotFound();

            if (!await CanAccessCourseVideosAsync(userId, lesson.CourseId))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You must enroll in this course to download lesson videos." });

            if (!await CanAccessLessonVideoAsync(userId, lesson))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "This lesson is not available yet." });

            var fileName = BuildVideoFileName(lesson.VideoTitle, lesson.VideoPath);
            return ServeWwwrootFile(lesson.VideoPath, download: true, downloadName: fileName);
        }

        [HttpGet("DownloadAllLessonVideosZip")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DownloadAllLessonVideosZip([FromQuery] long courseId)
        {
            if (!TryGetCurrentUserId(out var userId))
                return Unauthorized();

            if (!await CanAccessCourseVideosAsync(userId, courseId))
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "You must enroll in this course to download lesson videos." });

            var lessons = await _courseQueriesRepository.GetCourseLessonVideosAsync(courseId);
            if (lessons.Count == 0)
                return NotFound(new { message = "No lesson videos found for this course." });

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
            {
                var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var lesson in lessons)
                {
                    var relative = NormalizeRelativePath(lesson.VideoPath);
                    var fullPath = Path.GetFullPath(Path.Combine(webRoot, relative));
                    if (!fullPath.StartsWith(Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(fullPath))
                        continue;

                    var entryName = EnsureUniqueZipEntryName(BuildVideoFileName(lesson.VideoTitle, lesson.VideoPath), usedNames);
                    var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    await using var fileStream = System.IO.File.OpenRead(fullPath);
                    await fileStream.CopyToAsync(entryStream);
                }
            }

            memoryStream.Position = 0;
            var zipName = $"course-{courseId}-videos.zip";
            return File(memoryStream.ToArray(), "application/zip", zipName);
        }

        private async Task<bool> CanAccessCourseVideosAsync(long userId, long courseId)
        {
            if (userId <= 0 || courseId <= 0)
                return false;

            if (IsAdminUser())
                return true;

            var deliveryMode = await _courseQueriesRepository.GetCourseDeliveryModeAsync(courseId);
            if (!CourseLifecycleRules.AllowsWebLessonVideoPlayback(deliveryMode))
                return false;

            var teacherId = await _teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            if (teacherId.HasValue)
            {
                var courseTeacherId = await _courseQueriesRepository.GetCourseTeacherIdAsync(courseId);
                if (courseTeacherId.HasValue && courseTeacherId.Value == teacherId.Value)
                    return true;
            }

            return await _courseQueriesRepository.HasActiveEnrollmentAsync(userId, courseId);
        }

        private async Task<bool> CanAccessLessonVideoAsync(long userId, CourseLessonVideoAccessQri lesson)
        {
            if (IsAdminUser())
                return true;

            var teacherId = await _teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
            if (teacherId.HasValue)
            {
                var courseTeacherId = await _courseQueriesRepository.GetCourseTeacherIdAsync(lesson.CourseId);
                if (courseTeacherId.HasValue && courseTeacherId.Value == teacherId.Value)
                    return true;
            }

            var phase = CourseLifecycleRules.Parse(lesson.LifecyclePhase);
            var isVideoApproved = string.Equals(lesson.VideoModerationStatus, "approved", StringComparison.OrdinalIgnoreCase);
            return CourseLifecycleRules.CanAccessLessonVideo(
                phase,
                lesson.IsPublished,
                !string.IsNullOrWhiteSpace(lesson.VideoPath),
                isEnrolled: true,
                isStaff: false,
                isVideoApproved);
        }

        private bool IsAdminUser() => User.IsDashboardAdminRole();

        private IActionResult ServeWwwrootFile(string relativeUrl, bool download, string? downloadName)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var relative = NormalizeRelativePath(relativeUrl);
            var fullPath = Path.GetFullPath(Path.Combine(webRoot, relative));
            if (!fullPath.StartsWith(Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(fullPath))
                return NotFound();

            var contentType = "application/octet-stream";
            var ext = Path.GetExtension(fullPath).ToLowerInvariant();
            if (ext is ".mp4") contentType = "video/mp4";
            else if (ext is ".webm") contentType = "video/webm";
            else if (ext is ".mov") contentType = "video/quicktime";

            if (download)
                return PhysicalFile(fullPath, contentType, downloadName ?? Path.GetFileName(fullPath));

            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }

        private string NormalizeRelativePath(string relativeUrl)
        {
            if (string.IsNullOrWhiteSpace(relativeUrl))
                return string.Empty;

            var normalized = relativeUrl.Trim();
            var baseUrl = _configuration["BaseUrl"]?.Trim();
            if (!string.IsNullOrWhiteSpace(baseUrl) && normalized.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase))
                normalized = normalized[baseUrl.Length..];

            return normalized.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        }

        private static string BuildVideoFileName(string title, string videoPath)
        {
            var safeTitle = string.Join("_", (title ?? "lesson").Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries)).Trim();
            if (string.IsNullOrWhiteSpace(safeTitle))
                safeTitle = "lesson";

            var ext = Path.GetExtension(videoPath);
            if (string.IsNullOrWhiteSpace(ext))
                ext = ".mp4";

            return $"{safeTitle}{ext}";
        }

        private static string EnsureUniqueZipEntryName(string fileName, ISet<string> usedNames)
        {
            if (usedNames.Add(fileName))
                return fileName;

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var ext = Path.GetExtension(fileName);
            var index = 2;
            string candidate;
            do
            {
                candidate = $"{baseName}-{index}{ext}";
                index++;
            } while (!usedNames.Add(candidate));

            return candidate;
        }

        private bool TryGetCurrentUserId(out long userId)
        {
            var claimValue = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return long.TryParse(claimValue, out userId);
        }

        [HttpGet("GetPendingModeration")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> GetPendingModeration([FromQuery] GetPendingCourseModerationQuery query)
        {
            if (!IsAdminUser()) return Task.FromResult<IActionResult>(Forbid());
            return Query<GetPendingCourseModerationQuery, List<PendingCourseModerationQri>>(query);
        }

        [HttpPost("ReviewModeration")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
        public Task<IActionResult> ReviewModeration([FromBody] ReviewCourseModerationCommand command)
        {
            if (!IsAdminUser()) return Task.FromResult<IActionResult>(Forbid());
            return Edit<ReviewCourseModerationCommand, string>(command);
        }
    }
}
