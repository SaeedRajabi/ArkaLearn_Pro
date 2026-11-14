using System.Net;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourseIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherEnrolledStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherStudents;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchUserCourseComments;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCartRecommendations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Framework.Src.Utilities.OutService.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class CourseQueryRepository(
        ArkaSoftwareQueryDbContext dbContext,
        ITeacherQueryRepository teacherQueryRepository)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ICourseQueriesRepository
    {
        public async Task<PagedData<GetAllPopularCourseQri>?> GetAllPopularCourseExecuteAsync(GetAllPopularCourseQuery query)
        {
            PagedData<GetAllPopularCourseQri?> result = new();
            var querySampleResult = await _dbContext.Courses
                .Include(x => x.CoursePlan)
                .Include(x => x.Category)
                .AsNoTracking()
                .Where(x => x.IsPublish && x.ModerationStatus == TeacherApprovalStatus.Approved)
                .ToListAsync();
            var queryResult = querySampleResult!
                .OrderBy(x => x.Title);


            if (query.NeedTotalCount)
            {
                result.TotalCount = queryResult.Count();
            }

            var courses = queryResult!
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .ToList();

            var categoryLookup = await CategoryPathHelper.LoadLookupAsync(_dbContext);
            // Some published courses may lack CoursePlan / Category FKs — do not NRE the whole list.
            var mappedCourses = courses
                .Select(x => new GetAllPopularCourseQri
                {
                    Title = x.Title ?? string.Empty,
                    Slug = CourseSlugHelper.FromTitle(x.Title, x.CourseId),
                    CoursePrice = x.Price ?? 0,
                    OriginalPrice = x.OriginalPrice,
                    CourseId = x.CourseId,
                    CourseLevel = x.CourseLevel.ToDisplayName(),
                    CoursePlan = x.CoursePlan?.Title ?? string.Empty,
                    CreateAt = x.CreateAt.ToString("HH:mm | yyyy/MM/dd"),
                    LogoImage = x.LogoImage,
                    ShortDescription = x.Description,
                    CategoryName = x.Category?.Title ?? string.Empty,
                    CategoryId = x.CategoryId,
                    CategoryPath = CategoryPathHelper.BuildPath(x.CategoryId, categoryLookup),
                }).ToList();


            result.QueryResult = mappedCourses!;
            return result!;
        }

        public async Task<CourseQri> GetCourseByIdExecuteAsync(GetCourseByIdQuery query)
        {
            var courseId = query.CourseId;

            var course = await _dbContext.Courses
                .AsNoTracking()
                .AsSplitQuery()
                .Include(x => x.Category)
                .Include(x => x.Sections)
                    .ThenInclude(s => s.Lessons)
                .Include(x => x.Teacher)
                    .ThenInclude(t => t!.User)
                .Include(x => x.Teacher)
                    .ThenInclude(t => t!.TeacherEducations)
                .Include(x => x.CourseFaqs)
                .Include(x => x.Tags)
                .Include(x => x.Videos)
                .Include(x => x.InstallmentPlans)
                .FirstOrDefaultAsync(x => x.CourseId == courseId);

            if (course == null)
                return null!;

            var isStaffEarly = await IsCourseStaffViewerAsync(query.ViewerUserId, query.ViewerIsAdmin, course);
            if (!isStaffEarly && !(course.IsPublish && course.ModerationStatus == TeacherApprovalStatus.Approved))
                return null!;

            var dependencies = await _dbContext.CourseDependencies
                .AsNoTracking()
                .Where(d => d.CourseId == courseId && !d.IsDelete)
                .Select(d => d.DependencyTitle)
                .ToListAsync();

            var courseComments = await _dbContext.Set<CourseCommentQueryModel>()
                .AsNoTracking()
                .Where(c => c.CourseId == courseId)
                .Include(c => c.User)
                .OrderByDescending(c => c.CreateAt)
                .Take(200)
                .ToListAsync();

            var isEnrolled = query.ViewerUserId > 0
                && await HasActiveEnrollmentAsync(query.ViewerUserId, courseId);

            var enrollmentCount = await _dbContext.Enrollments
                .AsNoTracking()
                .CountAsync(e => e.CourseId == courseId && e.IsActive);

            var teacher = course.Teacher;
            var teacherUser = teacher?.User;
            var teacherUserName = teacherUser?.UserName ?? string.Empty;
            var teacherName = teacherUser != null
                ? $"{teacherUser.FirstName} {teacherUser.LastName}".Trim()
                : string.Empty;
            var educationTitle = teacher?.TeacherEducations?.FirstOrDefault()?.NameOfInstitutionOrUniversity ?? string.Empty;
            var teacherProfileImage = !string.IsNullOrWhiteSpace(teacherUser?.ProfileImage)
                ? teacherUser!.ProfileImage!
                : BuildAvatarPlaceholder(teacherUserName);

            var levelCode = course.CourseLevel == CourseLevel.INTERMEDIATE
                ? "intermediate"
                : course.CourseLevel == CourseLevel.ADVANCED
                    ? "advanced"
                    : "beginner";

            var utcNow = DateTime.UtcNow;
            var effectivePhase = CourseLifecycleRules.ResolveEffectivePhase(
                course.LifecyclePhase,
                course.RegistrationDeadlineUtc,
                course.CourseStartUtc,
                course.CourseEndUtc,
                utcNow);

            var teacherUserId = course.Teacher?.UserId ?? 0;
            var isStaff = isStaffEarly || await IsCourseStaffViewerAsync(query.ViewerUserId, query.ViewerIsAdmin, course);
            if (!isStaff)
                courseComments = courseComments.Where(c => c.IsApproved).ToList();
            var teacherStats = teacher?.Id > 0 && teacherUserId > 0
                ? await teacherQueryRepository.GetProfileStatsAsync(teacher.Id, teacherUserId)
                : null;

            var categoryLookup = await CategoryPathHelper.LoadLookupAsync(_dbContext);
            var categoryPath = CategoryPathHelper.BuildPath(course.CategoryId, categoryLookup);

            return new CourseQri
            {
                CourseId = course.CourseId,
                Slug = CourseSlugHelper.FromTitle(course.Title, course.CourseId),
                Title = course.Title ?? string.Empty,
                Status = course.Status.ToDisplayStatus(),
                Price = course.Price ?? 0,
                OriginalPrice = course.OriginalPrice,
                CheckoutPrice = ResolveCheckoutPrice(course),
                PaymentType = course.PaymentType == CoursePaymentType.Installment ? "installment" : "cash",
                InstallmentPlans = (course.InstallmentPlans ?? [])
                    .OrderBy(p => p.InstallmentNumber)
                    .Select(p => new CourseInstallmentPlanQri
                    {
                        InstallmentNumber = p.InstallmentNumber,
                        AmountToman = p.AmountToman,
                        DueDateUtc = p.DueDateUtc,
                    })
                    .ToList(),
                ThumbnailUrl = course.LogoImage ?? string.Empty,
                shortDescription = course.Description ?? string.Empty,
                Description = course.LongDescription ?? string.Empty,
                Category = course.Category?.Title ?? string.Empty,
                CategoryId = course.CategoryId ?? 0,
                CategoryPath = categoryPath,
                Level = course.CourseLevel.ToDisplayName(),
                LevelCode = levelCode,
                CourseRate = course.NumberOfRatings ?? 0,
                CreatedAt = course.CreateAt.ToPersianDateTimeString("yyyy/mm/dd - HH:mm"),
                VideoCount = course.Videos?.Count ?? 0,
                VideoUrl = course.Videos?.Select(v => v.VideoPath).FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)) ?? string.Empty,
                CourseTags = course.Tags?.Select(tag => tag.TagName).ToList() ?? [],
                TeacherName = teacherName,
                TeacherUserName = string.IsNullOrWhiteSpace(teacherUserName) ? "NOT" : teacherUserName,
                TeacherId = teacher?.Id ?? 0,
                TeacherBio = teacher?.LongDescription ?? string.Empty,
                IsCertificate = course.IsCertificate,
                IsPublish = course.IsPublish,
                ModerationStatus = course.ModerationStatus.ToString().ToLowerInvariant(),
                ModerationRejectionNote = isStaff ? course.ModerationRejectionNote : null,
                DeliveryMode = MapDeliveryMode(course.DeliveryMode),
                SpotPlayerCourseKey = null,
                LifecyclePhase = CourseLifecycleRules.ToApiValue(course.LifecyclePhase),
                EffectiveLifecyclePhase = CourseLifecycleRules.ToApiValue(effectivePhase),
                RegistrationDeadlineUtc = course.RegistrationDeadlineUtc,
                CourseStartUtc = course.CourseStartUtc,
                CourseEndUtc = course.CourseEndUtc,
                SeoTitle = course.SeoTitle,
                MetaDescription = course.MetaDescription,
                OgImageUrl = course.OgImageUrl,
                Language = course.CourseLanguage,
                IsRegistrationClosed = course.IsRegistrationClosed,
                CanRegister = course.IsPublish
                    && course.ModerationStatus == TeacherApprovalStatus.Approved
                    && CourseLifecycleRules.CanAcceptRegistration(
                    course.IsPublish,
                    effectivePhase,
                    course.IsRegistrationClosed),
                EducationTitle = educationTitle,
                Tags = course.Tags?.Select(tag => tag.TagName).ToList() ?? [],
                TeacherProfileImage = teacherProfileImage,
                TeacherPublishedCourseCount = teacherStats?.PublishedCourseCount ?? 0,
                TeacherPublishedArticleCount = teacherStats?.PublishedArticleCount ?? 0,
                TeacherPoints = teacherStats?.Points ?? 0,
                TeacherStudentCount = teacherStats?.StudentCount ?? 0,
                TeacherReviewCount = teacherStats?.ReviewCount ?? 0,
                EnrollmentCount = enrollmentCount,
                Dependencies = dependencies,
                Sections = (course.Sections ?? [])
                    .Select(section => new CourseSessionQri
                    {
                        SessionId = section.Id,
                        SessionTitle = section.SessionName ?? string.Empty,
                        CourseLessons = (section.Lessons ?? [])
                            .OrderBy(lesson => lesson.SortOrder)
                            .ThenBy(lesson => lesson.Id)
                            .Select(lesson => MapLessonForViewer(lesson, course.DeliveryMode, effectivePhase, isEnrolled, isStaff))
                            .ToList(),
                    })
                    .ToList(),
                FAQs = (course.CourseFaqs ?? [])
                    .Select(faq => new CourseFaqQri
                    {
                        Answer = faq.Answer ?? string.Empty,
                        Question = faq.Question ?? string.Empty
                    })
                    .ToList(),
                Comments = courseComments
                    .Where(comment => comment.User != null)
                    .Select(comment => new CourseCommentQri
                    {
                        AuthorName = string.IsNullOrWhiteSpace(comment.User.FirstName)
                            ? comment.User.UserName ?? string.Empty
                            : $"{comment.User.FirstName} {comment.User.LastName}".Trim(),
                        AuthorAvatar = !string.IsNullOrWhiteSpace(comment.User.ProfileImage)
                            ? comment.User.ProfileImage!
                            : BuildAvatarPlaceholder(comment.User.UserName ?? string.Empty),
                        CommentLike = comment.Likes,
                        Content = comment.CommentText ?? string.Empty,
                        CreateAt = comment.CreateAt.ToPersianDateTimeString("yyyy/mm/dd - HH:mm"),
                        Id = comment.Id
                    })
                    .ToList()
            };
        }

        private static CourseLessonQri MapLessonForViewer(
            CourseLessonQueryModel lesson,
            CourseDeliveryMode deliveryMode,
            CourseLifecyclePhase effectivePhase,
            bool isEnrolled,
            bool isStaff)
        {
            var hasPhysicalVideo = !string.IsNullOrWhiteSpace(lesson.VideoPath) || lesson.MediaAssetId is > 0;
            var isVideoApproved = lesson.VideoModerationStatus == TeacherApprovalStatus.Approved;
            var canAccessVideo = CourseLifecycleRules.CanAccessLessonVideo(
                effectivePhase,
                lesson.IsPublished,
                hasPhysicalVideo,
                isEnrolled,
                isStaff,
                isVideoApproved);
            var allowWebPlayback = CourseLifecycleRules.AllowsWebLessonVideoPlayback(deliveryMode);

            return new CourseLessonQri
            {
                LessonId = lesson.Id,
                LessonTitle = lesson.LessonTitle ?? string.Empty,
                VideoTitle = lesson.VideoTitle ?? string.Empty,
                // Staff editing need VideoUrl for direct-download; desktop DRM never exposes a streamable web URL.
                VideoUrl = canAccessVideo && allowWebPlayback
                    ? lesson.VideoPath ?? string.Empty
                    : (isStaff && allowWebPlayback ? lesson.VideoPath ?? string.Empty : string.Empty),
                DurationSeconds = lesson.DurationSeconds,
                DurationLabel = FormatLessonDuration(lesson.DurationSeconds),
                HasVideo = hasPhysicalVideo,
                IsPublished = lesson.IsPublished,
                IsLocked = hasPhysicalVideo && (!canAccessVideo || !allowWebPlayback),
                MediaAssetId = lesson.MediaAssetId,
                HasEncryptedVideo = lesson.MediaAssetId is > 0,
            };
        }

        private static decimal ResolveCheckoutPrice(CourseQueryModel course)
        {
            if (course.PaymentType == CoursePaymentType.Installment
                && course.InstallmentPlans is { Count: > 0 })
            {
                var first = course.InstallmentPlans.OrderBy(p => p.InstallmentNumber).FirstOrDefault();
                if (first != null && first.AmountToman > 0)
                    return first.AmountToman;
            }

            return course.Price ?? 0;
        }

        private static string MapDeliveryMode(CourseDeliveryMode mode) =>
            mode switch
            {
                CourseDeliveryMode.DesktopLicense => "desktopLicense",
                // SpotPlayer retired — surface as Arka desktop license
                CourseDeliveryMode.SpotPlayerLicense => "desktopLicense",
                _ => "directDownload",
            };

        private static string BuildAvatarPlaceholder(string userName)
        {
            if (string.IsNullOrWhiteSpace(userName))
                return "/assets/icons/defaultUserImage.png";

            var prefix = userName.Length >= 2 ? userName[..2] : userName;
            return $"https://placehold.co/100x100/1/000000?text={Uri.EscapeDataString(prefix)}";
        }

        public async Task<CourseQri?> GetCourseBySlugExecuteAsync(GetCourseBySlugQuery query)
        {
            var slug = WebUtility.UrlDecode(query.Slug)?.Trim();
            if (string.IsNullOrWhiteSpace(slug))
                return null;

            long? courseId = null;
            if (long.TryParse(slug, out var parsedId))
                courseId = parsedId;

            if (!courseId.HasValue)
            {
                var normalized = slug.ToLowerInvariant();
                var candidates = await _dbContext.Courses
                    .AsNoTracking()
                    .Where(x => x.IsPublish && x.ModerationStatus == TeacherApprovalStatus.Approved && x.Title != null)
                    .Select(x => new { x.CourseId, x.Title })
                    .ToListAsync();

                var match = candidates.FirstOrDefault(c =>
                    CourseSlugHelper.FromTitle(c.Title, c.CourseId).Equals(normalized, StringComparison.OrdinalIgnoreCase) ||
                    CourseSlugHelper.FromTitle(c.Title).Equals(normalized, StringComparison.OrdinalIgnoreCase));

                courseId = match?.CourseId;
            }

            if (!courseId.HasValue || courseId.Value <= 0)
                return null;

            return await GetCourseByIdExecuteAsync(new GetCourseByIdQuery
            {
                CourseId = courseId.Value,
                ViewerUserId = query.ViewerUserId,
            });
        }

        private static string MapProfessorCourseStatus(bool isPublish, TeacherApprovalStatus moderationStatus)
        {
            if (!isPublish)
                return "Draft";
            if (moderationStatus == TeacherApprovalStatus.Approved)
                return "Published";
            if (moderationStatus == TeacherApprovalStatus.Pending)
                return "PendingReview";
            if (moderationStatus == TeacherApprovalStatus.Rejected)
                return "Rejected";
            return "Draft";
        }

        private static string ResolveLessonPlaybackPath(CourseLessonQueryModel lesson)
        {
            if (lesson.VideoModerationStatus == TeacherApprovalStatus.Approved
                && !string.IsNullOrWhiteSpace(lesson.WatermarkedVideoPath))
                return lesson.WatermarkedVideoPath!;
            return lesson.VideoPath ?? string.Empty;
        }

        private static string FormatLessonDuration(int seconds)
        {
            if (seconds <= 0)
                return "0m";

            var span = TimeSpan.FromSeconds(seconds);
            if (span.TotalHours >= 1)
                return $"{(int)span.TotalHours}h {span.Minutes}m";

            return span.TotalMinutes < 1 ? $"{seconds}s" : $"{(int)span.TotalMinutes}m";
        }

        public async Task<bool> HasActiveEnrollmentAsync(long userId, long courseId)
        {
            if (userId <= 0 || courseId <= 0)
                return false;

            return await (
                from e in _dbContext.Enrollments.AsNoTracking()
                join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                where s.User!.Id == userId && e.CourseId == courseId && e.IsActive
                select e.Id
            ).AnyAsync();
        }

        public Task<long?> GetCourseTeacherIdAsync(long courseId) =>
            _dbContext.Courses.AsNoTracking()
                .Where(c => c.CourseId == courseId)
                .Select(c => c.TeacherId)
                .FirstOrDefaultAsync();

        public async Task<CourseLessonVideoAccessQri?> GetLessonVideoAccessAsync(long lessonId)
        {
            var lesson = await _dbContext.CourseLessons.AsNoTracking()
                .Include(l => l.CourseSection)
                .ThenInclude(s => s!.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null || string.IsNullOrWhiteSpace(lesson.VideoPath))
                return null;

            var course = lesson.CourseSection?.Course;
            var effectivePhase = course == null
                ? CourseLifecyclePhase.Ended
                : CourseLifecycleRules.ResolveEffectivePhase(
                    course.LifecyclePhase,
                    course.RegistrationDeadlineUtc,
                    course.CourseStartUtc,
                    course.CourseEndUtc,
                    DateTime.UtcNow);

            return new CourseLessonVideoAccessQri
            {
                LessonId = lesson.Id,
                CourseId = lesson.CourseSection?.CourseId ?? 0,
                LessonTitle = lesson.LessonTitle ?? string.Empty,
                VideoTitle = string.IsNullOrWhiteSpace(lesson.VideoTitle) ? lesson.LessonTitle ?? string.Empty : lesson.VideoTitle,
                VideoPath = ResolveLessonPlaybackPath(lesson),
                SectionTitle = lesson.CourseSection?.SessionName ?? string.Empty,
                IsPublished = lesson.IsPublished,
                VideoModerationStatus = lesson.VideoModerationStatus.ToString().ToLowerInvariant(),
                LifecyclePhase = CourseLifecycleRules.ToApiValue(effectivePhase),
            };
        }

        public async Task<List<CourseLessonVideoAccessQri>> GetCourseLessonVideosAsync(long courseId)
        {
            var course = await _dbContext.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.CourseId == courseId);

            var effectivePhase = course == null
                ? CourseLifecyclePhase.Ended
                : CourseLifecycleRules.ResolveEffectivePhase(
                    course.LifecyclePhase,
                    course.RegistrationDeadlineUtc,
                    course.CourseStartUtc,
                    course.CourseEndUtc,
                    DateTime.UtcNow);

            var lessons = await _dbContext.CourseLessons.AsNoTracking()
                .Include(l => l.CourseSection)
                .Where(l => l.CourseSection != null && l.CourseSection.CourseId == courseId && l.VideoPath != null && l.VideoPath != "")
                .OrderBy(l => l.CourseSection!.SessionName)
                .ThenBy(l => l.SortOrder)
                .ThenBy(l => l.Id)
                .ToListAsync();

            return lessons
                .Where(l => effectivePhase == CourseLifecyclePhase.Ended || l.IsPublished)
                .Select(l => new CourseLessonVideoAccessQri
                {
                    LessonId = l.Id,
                    CourseId = courseId,
                    LessonTitle = l.LessonTitle ?? string.Empty,
                    VideoTitle = string.IsNullOrWhiteSpace(l.VideoTitle) ? l.LessonTitle ?? string.Empty : l.VideoTitle,
                    VideoPath = ResolveLessonPlaybackPath(l),
                    SectionTitle = l.CourseSection!.SessionName ?? string.Empty,
                    IsPublished = l.IsPublished,
                    LifecyclePhase = CourseLifecycleRules.ToApiValue(effectivePhase),
                })
                .ToList();
        }

        public async Task<CourseDeliveryMode> GetCourseDeliveryModeAsync(long courseId)
        {
            var mode = await _dbContext.Courses.AsNoTracking()
                .Where(c => c.CourseId == courseId)
                .Select(c => (CourseDeliveryMode?)c.DeliveryMode)
                .FirstOrDefaultAsync();
            return mode ?? CourseDeliveryMode.DirectDownload;
        }

        public async Task<List<LessonWatchProgressQri>> GetMyCourseLessonProgressAsync(long userId, long courseId)
        {
            if (userId <= 0 || courseId <= 0)
                return [];

            var rows = await _dbContext.CourseLessonWatchProgress.AsNoTracking()
                .Where(x => x.UserId == userId && x.CourseId == courseId)
                .ToListAsync();

            return rows.Select(x => new LessonWatchProgressQri
            {
                LessonId = x.LessonId,
                WatchedSeconds = x.WatchedSeconds,
                DurationSeconds = x.DurationSeconds,
                WatchedPercent = CalculateWatchedPercent(x.WatchedSeconds, x.DurationSeconds),
                IsCompleted = x.IsCompleted,
            }).ToList();
        }

        private static int CalculateWatchedPercent(int watchedSeconds, int durationSeconds)
        {
            if (durationSeconds <= 0)
                return watchedSeconds > 0 ? 100 : 0;

            return Math.Min(100, (int)Math.Round(watchedSeconds * 100.0 / durationSeconds));
        }

        public async Task<PagedData<SearchCourseQri>?> SearchCourseExecuteAsync(SearchCourseByInputValueQuery query)
        {
            var q = _dbContext.Courses
                .AsNoTracking()
                .Include(x => x.CoursePlan)
                .Include(x => x.Category)
                .Include(x => x.Videos)
                .Where(x => x.Title != null && x.IsPublish && x.ModerationStatus == TeacherApprovalStatus.Approved);

            if (!string.IsNullOrWhiteSpace(query.InputValue))
            {
                q = q.Where(x => EF.Functions.Like(x.Title!, $"%{query.InputValue}%"));
            }

            q = q.OrderBy(x => x.Title);

            var result = new PagedData<SearchCourseQri?>();

            if (query.NeedTotalCount)
                result.TotalCount = await q.CountAsync();
            var page = await q
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new
                {
                    x.Title,
                    Price = x.Price ?? 0,
                    OriginalPrice = x.OriginalPrice,
                    x.CourseId,
                    x.CourseLevel,
                    CoursePlanTitle = x.CoursePlan!.Title,
                    x.CreateAt,
                    x.IsPublish,
                    x.Videos,
                    CategoryName = x.Category!.Title,
                    CategoryId = x.CategoryId,
                    x.Description,
                    x.LogoImage,
                    x.AverageRateValue,
                    x.NumberOfRatings,
                    x.DeliveryMode,
                    TeacherFirstName = x.Teacher != null && x.Teacher.User != null ? x.Teacher.User.FirstName : null,
                    TeacherLastName = x.Teacher != null && x.Teacher.User != null ? x.Teacher.User.LastName : null,
                })
                .ToListAsync();

            var courseIds = page.Select(x => x.CourseId).ToList();
            if (courseIds.Count == 0)
            {
                result.QueryResult = [];
                return result;
            }

            var studentCounts = await _dbContext.Enrollments
                .AsNoTracking()
                .Where(e => courseIds.Contains(e.CourseId) && e.IsActive)
                .GroupBy(e => e.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var likeCounts = await _dbContext.FavoriteCourses
                .AsNoTracking()
                .Where(f => courseIds.Contains(f.CourseId))
                .GroupBy(f => f.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var commentCounts = await _dbContext.Courses
                .AsNoTracking()
                .Where(c => courseIds.Contains(c.CourseId))
                .Select(c => new
                {
                    c.CourseId,
                    Count = c.Comments.Count(cm => cm.IsApproved),
                })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var categoryLookup = await CategoryPathHelper.LoadLookupAsync(_dbContext);

            result.QueryResult = page.Select(x =>
            {
                var teacherName = string.Join(
                    " ",
                    new[] { x.TeacherFirstName, x.TeacherLastName }
                        .Where(p => !string.IsNullOrWhiteSpace(p))
                        .Select(p => p!.Trim()));
                var durationMinutes = (int)Math.Round(
                    (x.Videos ?? []).Sum(v => v.Duration.TotalMinutes));

                return new SearchCourseQri
                {
                    Title = x.Title!,
                    Slug = CourseSlugHelper.FromTitle(x.Title, x.CourseId),
                    Price = x.Price,
                    OriginalPrice = x.OriginalPrice,
                    Id = x.CourseId,
                    CourseLevel = x.CourseLevel.ToDisplayName(),
                    CoursePlan = x.CoursePlanTitle,
                    CreateAt = x.CreateAt.ToString("HH:mm | yyyy/MM/dd"),
                    CategoryName = x.CategoryName,
                    CategoryId = x.CategoryId,
                    CategoryPath = CategoryPathHelper.BuildPath(x.CategoryId, categoryLookup),
                    VideoUrl = x.Videos.FirstOrDefault()?.VideoPath ?? string.Empty,
                    Status = x.IsPublish == true ? "Published" : "Draft",
                    IsPublish = x.IsPublish == true,
                    ShortDescription = x.Description,
                    TitleImage = x.LogoImage,
                    StudentCount = studentCounts.GetValueOrDefault(x.CourseId),
                    LikeCount = likeCounts.GetValueOrDefault(x.CourseId),
                    CommentCount = commentCounts.GetValueOrDefault(x.CourseId),
                    Rating = x.AverageRateValue.HasValue
                        ? (decimal)x.AverageRateValue.Value
                        : 0,
                    TeacherName = teacherName,
                    DurationMinutes = durationMinutes,
                    DeliveryMode = MapDeliveryMode(x.DeliveryMode),
                };
            }).ToList()!;

            return result!;
        }

        public async Task<PagedData<SearchCourseQri>?> SearchTeacherCoursesExecuteAsync(SearchTeacherCoursesQuery query)
        {
            var teacherId = await _dbContext.Teachers
                .AsNoTracking()
                .Where(t => t.UserId == query.TeacherUserId)
                .Select(t => (long?)t.Id)
                .FirstOrDefaultAsync();

            if (!teacherId.HasValue || teacherId.Value <= 0)
                return new PagedData<SearchCourseQri?> { QueryResult = [], TotalCount = 0 };

            var q = _dbContext.Courses
                .AsNoTracking()
                .Include(x => x.Category)
                .Include(x => x.CoursePlan)
                .Include(x => x.Videos)
                .Where(x => x.TeacherId == teacherId.Value && x.Title != null);

            if (!string.IsNullOrWhiteSpace(query.InputValue))
                q = q.Where(x => EF.Functions.Like(x.Title!, $"%{query.InputValue}%"));

            q = q.OrderByDescending(x => x.CreateAt);

            var result = new PagedData<SearchCourseQri?>();
            if (query.NeedTotalCount)
                result.TotalCount = await q.CountAsync();

            var page = await q
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new
                {
                    x.Title,
                    Price = x.Price ?? 0,
                    OriginalPrice = x.OriginalPrice,
                    x.CourseId,
                    x.CourseLevel,
                    CoursePlanTitle = x.CoursePlan!.Title,
                    x.CreateAt,
                    x.IsPublish,
                    x.ModerationStatus,
                    x.ModerationRejectionNote,
                    x.Videos,
                    CategoryName = x.Category!.Title,
                    CategoryId = x.CategoryId,
                    x.Description,
                    x.LogoImage,
                    x.AverageRateValue,
                    x.NumberOfRatings,
                    x.DeliveryMode,
                })
                .ToListAsync();

            var courseIds = page.Select(x => x.CourseId).ToList();
            if (courseIds.Count == 0)
            {
                result.QueryResult = [];
                return result;
            }

            var studentCounts = await _dbContext.Enrollments
                .AsNoTracking()
                .Where(e => courseIds.Contains(e.CourseId) && e.IsActive)
                .GroupBy(e => e.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var likeCounts = await _dbContext.FavoriteCourses
                .AsNoTracking()
                .Where(f => courseIds.Contains(f.CourseId))
                .GroupBy(f => f.CourseId)
                .Select(g => new { CourseId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var commentCounts = await _dbContext.Courses
                .AsNoTracking()
                .Where(c => courseIds.Contains(c.CourseId))
                .Select(c => new
                {
                    c.CourseId,
                    Count = c.Comments.Count(cm => cm.IsApproved),
                })
                .ToDictionaryAsync(x => x.CourseId, x => x.Count);

            var categoryLookup = await CategoryPathHelper.LoadLookupAsync(_dbContext);

            result.QueryResult = page.Select(x => new SearchCourseQri
            {
                Title = x.Title!,
                Slug = CourseSlugHelper.FromTitle(x.Title, x.CourseId),
                Price = x.Price,
                OriginalPrice = x.OriginalPrice,
                Id = x.CourseId,
                CourseLevel = x.CourseLevel.ToDisplayName(),
                CoursePlan = x.CoursePlanTitle,
                CreateAt = x.CreateAt.ToString("HH:mm | yyyy/MM/dd"),
                CategoryName = x.CategoryName,
                CategoryId = x.CategoryId,
                CategoryPath = CategoryPathHelper.BuildPath(x.CategoryId, categoryLookup),
                VideoUrl = x.Videos.FirstOrDefault()!.VideoPath ?? string.Empty,
                Status = MapProfessorCourseStatus(x.IsPublish, x.ModerationStatus),
                IsPublish = x.IsPublish,
                ModerationStatus = x.ModerationStatus.ToString().ToLowerInvariant(),
                ModerationRejectionNote = x.ModerationRejectionNote,
                ShortDescription = x.Description,
                TitleImage = x.LogoImage,
                StudentCount = studentCounts.GetValueOrDefault(x.CourseId),
                LikeCount = likeCounts.GetValueOrDefault(x.CourseId),
                CommentCount = commentCounts.GetValueOrDefault(x.CourseId),
                Rating = x.AverageRateValue.HasValue
                    ? (decimal)x.AverageRateValue.Value
                    : x.NumberOfRatings ?? 0,
                DeliveryMode = MapDeliveryMode(x.DeliveryMode),
            }).ToList()!;

            return result;
        }

        
        public async Task<PagedData<GetAllCommentsByCourseIdQri>> GetAllCourseCommentsById(GetAllCommentsByCourseIdQuery query)
        {
            PagedData<GetAllCommentsByCourseIdQri?> result = new();

            // Get All Categories
            var course = await _dbContext.Courses
                .Include(x => x.Comments)
                .ThenInclude(c => c.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.CourseId == query.CourseId);

            
            // Filter By Category Name
            var courseComments = course?.Comments?.ToList() ?? new List<CourseCommentQueryModel>();
            if (query.OnlyApproved == true)
                courseComments = courseComments.Where(x => x.IsApproved == true).ToList();

            if (courseComments == null || !courseComments.Any())
            {
                result.QueryResult = new List<GetAllCommentsByCourseIdQri>();
                result.TotalCount = 0;
                return result;
            }

            var items = courseComments
                .Where(c => c.User != null) // Filter out comments with null User
                .Select(c => new GetAllCommentsByCourseIdQri
                {
                    Id = c.Id,
                    Author = new CommentAuthorQri
                    {
                        Id = c.User.Id,
                        AvatarUrl = c.User.ProfileImage!,
                        FullName = c.User.FirstName + " " + c.User.LastName,
                        UserName = c.User.UserName!
                    },
                    Text = c.CommentText,
                    Likes = c.Likes,
                    ParentId = c.ParentId,
                    Rating = c.Rating,
                    IsApproved = c.IsApproved,
                    TimeStamp = c.CreateAt.ToPersianDateTimeString("yyyy/mm/dd - HH:mm"),
                }).ToList();

            // 2) ساخت دیکشنری برای دسترسی سریع
            var dict = items.ToDictionary(x => x.Id);

            // 3) ساخت Tree
            var roots = new List<GetAllCommentsByCourseIdQri>();


            foreach (var node in items)
            {
                if (node.ParentId is null)
                {
                    roots.Add(node);
                    continue;
                }

                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                {
                    parent.Replies.Add(node);
                }
                else
                {
                    // اگر ParentId اشاره به چیزی دارد که در لیست نیست (داده خراب/فیلتر Approved)،
                    // می‌تونی این رو root حساب کنی یا ردش کنی
                    roots.Add(node);
                }
            }
            var rootComments = roots
               .Where(c => !c.ParentId.HasValue)
               .Skip(query.SkipCount)
               .Take(query.PageSize)
               .ToList();

            result.QueryResult = rootComments!;
            result.TotalCount = roots.Count;
            return result!;
        }

        public async Task<List<GetTeacherCourseCommentsQri>> GetTeacherCourseCommentsAsync(long teacherId, long? courseId, bool? onlyPending)
        {
            var coursesQuery = _dbContext.Courses.AsNoTracking().Where(c => c.TeacherId == teacherId);
            if (courseId.HasValue)
                coursesQuery = coursesQuery.Where(c => c.CourseId == courseId.Value);

            var courses = await coursesQuery
                .Select(c => new { c.CourseId, c.Title })
                .ToListAsync();

            var courseIds = courses.Select(c => c.CourseId).ToList();
            if (courseIds.Count == 0)
                return [];

            var courseTitleMap = courses.ToDictionary(c => c.CourseId, c => c.Title ?? string.Empty);

            var allComments = await _dbContext.Set<CourseCommentQueryModel>()
                .AsNoTracking()
                .Include(c => c.User)
                .Where(c => courseIds.Contains(c.CourseId))
                .OrderByDescending(c => c.CreateAt)
                .ToListAsync();

            var items = allComments
                .Where(c => c.User != null)
                .Select(c => new GetTeacherCourseCommentsQri
                {
                    Id = c.Id,
                    CourseId = c.CourseId,
                    CourseTitle = courseTitleMap.GetValueOrDefault(c.CourseId, string.Empty),
                    Author = new CommentAuthorQri
                    {
                        Id = c.User.Id,
                        AvatarUrl = c.User.ProfileImage!,
                        FullName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
                        UserName = c.User.UserName!
                    },
                    Text = c.CommentText,
                    Likes = c.Likes,
                    ParentId = c.ParentId,
                    Rating = c.Rating,
                    IsApproved = c.IsApproved,
                    TimeStamp = c.CreateAt.ToPersianDateTimeString("yyyy/mm/dd - HH:mm"),
                }).ToList();

            var dict = items.ToDictionary(x => x.Id);
            var roots = new List<GetTeacherCourseCommentsQri>();

            foreach (var node in items)
            {
                if (node.ParentId is null)
                {
                    roots.Add(node);
                    continue;
                }

                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                    parent.Replies.Add(node);
                else
                    roots.Add(node);
            }

            var rootComments = roots.Where(c => !c.ParentId.HasValue).ToList();
            if (onlyPending == true)
                rootComments = rootComments.Where(c => !c.IsApproved).ToList();

            return rootComments;
        }

        public async Task<List<GetMyCoursesQri>> GetMyCoursesAsync(GetMyCoursesQuery query)
        {
            var utcNow = DateTime.UtcNow;
            var result = await (from e in _dbContext.Enrollments.AsNoTracking()
                                join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                                join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                                where s.UserId == query.UserId
                                orderby e.EnrollmentDateTime descending
                                select new
                                {
                                    CourseId = c.CourseId,
                                    c.Title,
                                    c.LogoImage,
                                    e.SpotPlayerLicense,
                                    e.DesktopLicenseKey,
                                    e.IsActive,
                                    c.Price,
                                    c.DeliveryMode,
                                    c.LifecyclePhase,
                                    c.RegistrationDeadlineUtc,
                                    c.CourseStartUtc,
                                    c.CourseEndUtc,
                                    e.EnrollmentDateTime,
                                }).ToListAsync();

            var courseIds = result.Select(x => x.CourseId).Distinct().ToList();
            var lessonStats = await _dbContext.CourseLessons.AsNoTracking()
                .Include(l => l.CourseSection)
                .Where(l => l.CourseSection != null && courseIds.Contains(l.CourseSection.CourseId))
                .GroupBy(l => l.CourseSection!.CourseId)
                .Select(g => new
                {
                    CourseId = g.Key,
                    Total = g.Count(),
                    Published = g.Count(l => l.IsPublished),
                })
                .ToDictionaryAsync(x => x.CourseId, x => x);

            return result.Select(row =>
            {
                var effectivePhase = CourseLifecycleRules.ResolveEffectivePhase(
                    row.LifecyclePhase,
                    row.RegistrationDeadlineUtc,
                    row.CourseStartUtc,
                    row.CourseEndUtc,
                    utcNow);
                lessonStats.TryGetValue(row.CourseId, out var stats);
                var progress = effectivePhase == CourseLifecyclePhase.Ended
                    ? 100
                    : stats is { Total: > 0 }
                        ? (int)Math.Round(stats.Published * 100.0 / stats.Total)
                        : 0;

                return new GetMyCoursesQri
                {
                    Id = row.CourseId,
                    Title = row.Title!,
                    ImageUrl = row.LogoImage!,
                    SpotPlayerToken = row.SpotPlayerLicense,
                    DesktopLicenseKey = row.DesktopLicenseKey,
                    OnlineClassUrl = null,
                    Progress = progress,
                    Status = row.IsActive
                        ? ((row.Price ?? 0) == 0 ? "Free" : "Paid")
                        : "PendingApproval",
                    EnrollmentDateTime = row.EnrollmentDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                    IsFree = (row.Price ?? 0) == 0,
                    Price = row.Price ?? 0,
                    DeliveryMode = MapDeliveryMode(row.DeliveryMode),
                    IsActive = row.IsActive,
                    IsPendingApproval = false,
                    IsLicenseRequestPending = ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services.DesktopLicenseRequestMarkers.IsPending(row.SpotPlayerLicense),
                    LifecyclePhase = CourseLifecycleRules.ToApiValue(row.LifecyclePhase),
                    EffectiveLifecyclePhase = CourseLifecycleRules.ToApiValue(effectivePhase),
                };
            }).ToList();
        }

        public async Task<List<TeacherEnrolledStudentQri>> GetTeacherEnrolledStudentsAsync(long teacherId)
        {
            return await (
                from e in _dbContext.Enrollments.AsNoTracking()
                join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
                join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                where c.TeacherId == teacherId
                orderby e.EnrollmentDateTime descending
                select new TeacherEnrolledStudentQri
                {
                    StudentId = s.StudentId,
                    UserId = u.Id,
                    FullName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim(),
                    UserName = u.UserName,
                    Email = u.Email,
                    CourseId = c.CourseId,
                    CourseTitle = c.Title ?? string.Empty,
                    EnrollmentDateTime = e.EnrollmentDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                    IsActive = e.IsActive,
                }).ToListAsync();
        }

        public async Task<PagedData<TeacherStudentQri>> GetTeacherStudentsPagedAsync(
            long? teacherId,
            long teacherUserId,
            string? searchTerm,
            int pageNumber,
            int pageSize)
        {
            var courseRows = new List<TeacherStudentQri>();
            if (teacherId.HasValue)
            {
                courseRows = await (
                    from e in _dbContext.Enrollments.AsNoTracking()
                    join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                    join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
                    join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                    where c.TeacherId == teacherId.Value
                    orderby e.EnrollmentDateTime descending
                    select new TeacherStudentQri
                    {
                        StudentId = s.StudentId,
                        UserId = u.Id,
                        FullName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim(),
                        UserName = u.UserName,
                        Email = u.Email,
                        PhoneNumber = u.PhoneNumber,
                        SourceType = "course",
                        SourceId = c.CourseId,
                        SourceTitle = c.Title ?? string.Empty,
                        RegisteredAt = e.EnrollmentDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                        IsActive = e.IsActive,
                    }).ToListAsync();
            }

            var seminarRows = await (
                from reg in _dbContext.Set<Entities.Seminars.SeminarRegistrationQueryModel>().AsNoTracking()
                join sem in _dbContext.Seminars.AsNoTracking() on reg.SeminarId equals sem.Id
                join room in _dbContext.Rooms.AsNoTracking() on sem.RoomId equals room.RoomId
                join u in _dbContext.Users.AsNoTracking() on reg.UserId equals u.Id
                join s in _dbContext.Students.AsNoTracking() on u.Id equals s.UserId into studentJoin
                from s in studentJoin.DefaultIfEmpty()
                where sem.RoomId != null && room.UserId == teacherUserId
                orderby reg.RegisteredAt descending
                select new TeacherStudentQri
                {
                    StudentId = s != null ? s.StudentId : 0,
                    UserId = u.Id,
                    FullName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim(),
                    UserName = u.UserName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    SourceType = "seminar",
                    SourceId = sem.Id,
                    SourceTitle = sem.Title ?? string.Empty,
                    RegisteredAt = reg.RegisteredAt.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                    IsActive = reg.HasPaid || sem.IsFree,
                }).ToListAsync();

            var allRows = courseRows.Concat(seminarRows).ToList();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim();
                allRows = allRows
                    .Where(x => MatchesTeacherStudentSearch(x, term))
                    .ToList();
            }

            var page = Math.Max(1, pageNumber);
            var size = Math.Clamp(pageSize, 1, 100);
            var totalCount = allRows.Count;

            var portalUserIds = allRows.Select(x => x.UserId).Distinct().ToList();
            var managedIdByPortalUser = new Dictionary<long, long?>();
            foreach (var portalUserId in portalUserIds)
            {
                managedIdByPortalUser[portalUserId] = await FindManagedRoomStudentIdByPortalUserIdAsync(portalUserId);
            }

            foreach (var row in allRows)
            {
                if (managedIdByPortalUser.TryGetValue(row.UserId, out var managedId))
                    row.ManagedRoomStudentId = managedId;
            }

            return new PagedData<TeacherStudentQri>
            {
                QueryResult = allRows.Skip((page - 1) * size).Take(size).ToList(),
                PageNumber = page,
                PageSize = size,
                TotalCount = totalCount,
            };
        }

        private static bool MatchesTeacherStudentSearch(TeacherStudentQri row, string term) =>
            (row.FullName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
            || (row.UserName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
            || (row.Email?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
            || (row.PhoneNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false)
            || (row.SourceTitle?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false);

        public async Task<bool> IsPortalUserInTeacherScopeAsync(long teacherUserId, long portalUserId)
        {
            if (teacherUserId <= 0 || portalUserId <= 0)
                return false;

            var teacherId = await _dbContext.Teachers.AsNoTracking()
                .Where(t => t.UserId == teacherUserId)
                .Select(t => (long?)t.Id)
                .FirstOrDefaultAsync();

            if (teacherId.HasValue)
            {
                var inCourse = await (
                    from e in _dbContext.Enrollments.AsNoTracking()
                    join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
                    join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                    where s.UserId == portalUserId && c.TeacherId == teacherId.Value
                    select e.StudentId).AnyAsync();

                if (inCourse)
                    return true;
            }

            return await (
                from reg in _dbContext.Set<Entities.Seminars.SeminarRegistrationQueryModel>().AsNoTracking()
                join sem in _dbContext.Seminars.AsNoTracking() on reg.SeminarId equals sem.Id
                join room in _dbContext.Rooms.AsNoTracking() on sem.RoomId equals room.RoomId
                where reg.UserId == portalUserId && sem.RoomId != null && room.UserId == teacherUserId
                select reg.UserId).AnyAsync();
        }

        public async Task<long?> FindManagedRoomStudentIdByPortalUserIdAsync(long portalUserId)
        {
            if (portalUserId <= 0)
                return null;

            var user = await _dbContext.Users.AsNoTracking()
                .Where(u => u.Id == portalUserId)
                .Select(u => new { u.UserName, u.Email })
                .FirstOrDefaultAsync();

            if (user == null)
                return null;

            var userName = user.UserName?.Trim();
            var email = user.Email?.Trim();

            return await _dbContext.ManagedRoomStudents.AsNoTracking()
                .Where(x => !x.IsDelete &&
                    ((!string.IsNullOrWhiteSpace(userName) && x.UserName == userName) ||
                     (!string.IsNullOrWhiteSpace(email) && x.Email != null &&
                      x.Email.ToLower() == email.ToLower())))
                .OrderByDescending(x => x.Id)
                .Select(x => (long?)x.Id)
                .FirstOrDefaultAsync();
        }

        public async Task<List<long>> GetMyFavoriteCourseIdsAsync(GetMyFavoriteCourseIdsQuery query)
        {
            if (query.UserId <= 0)
                return new List<long>();

            return await _dbContext.FavoriteCourses
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .Select(x => x.CourseId)
                .ToListAsync();
        }

        public async Task<List<GetMyFavoriteCourseQri>> GetMyFavoriteCoursesAsync(GetMyFavoriteCoursesQuery query)
        {
            if (query.UserId <= 0)
                return new List<GetMyFavoriteCourseQri>();

            var result = await _dbContext.FavoriteCourses
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Course,
                    x.Course!.Category,
                    x.Course!.Videos
                })
                .Select(x => new GetMyFavoriteCourseQri
                {
                    Id = x.Course!.CourseId,
                    Title = x.Course.Title!,
                    Price = x.Course.Price ?? 0,
                    CreateAt = x.Course.CreateAt.ToString("HH:mm | yyyy/MM/dd"),
                    CourseLevel = x.Course.CourseLevel.ToDisplayName(),
                    ShortDescription = x.Course.Description,
                    TitleImage = x.Course.LogoImage,
                    CategoryName = x.Course.Category!.Title,
                    Status = x.Course.IsPublish == true ? "Published" : "Draft",
                    VideoUrl = x.Course.Videos.Select(v => v.VideoPath).FirstOrDefault(),
                    StudentCount = x.Course.NumberOfRatings ?? 0
                })
                .ToListAsync();

            return result;
        }

        public async Task<PagedData<SearchUserCourseCommentQri>> SearchUserCourseCommentsAsync(SearchUserCourseCommentsQuery query)
        {
            var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
            var pageSize = query.PageSize <= 0 ? 20 : query.PageSize;

            var allComments = await _dbContext.Set<CourseCommentQueryModel>()
                .AsNoTracking()
                .Include(c => c.User)
                .Include(c => c.Course)
                .Where(c => c.UserId == query.UserId)
                .OrderByDescending(c => c.CreateAt)
                .ToListAsync();

            var items = allComments
                .Where(c => c.User != null)
                .Select(c => new SearchUserCourseCommentQri
                {
                    Id = c.Id,
                    CourseId = c.CourseId,
                    CourseTitle = c.Course?.Title ?? string.Empty,
                    Author = new CommentAuthorQri
                    {
                        Id = c.User.Id,
                        AvatarUrl = c.User.ProfileImage ?? string.Empty,
                        FullName = $"{c.User.FirstName} {c.User.LastName}".Trim(),
                        UserName = c.User.UserName ?? string.Empty,
                    },
                    Text = c.CommentText,
                    Likes = c.Likes,
                    ParentId = c.ParentId,
                    Rating = c.Rating,
                    IsApproved = c.IsApproved,
                    TimeStamp = c.CreateAt.ToPersianDateTimeString("yyyy/mm/dd - HH:mm"),
                }).ToList();

            var dict = items.ToDictionary(x => x.Id);
            var roots = new List<SearchUserCourseCommentQri>();

            foreach (var node in items)
            {
                if (node.ParentId is null)
                {
                    roots.Add(node);
                    continue;
                }

                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                    parent.Replies.Add(node);
                else
                    roots.Add(node);
            }

            var rootComments = roots.Where(c => !c.ParentId.HasValue).ToList();
            var totalCount = query.NeedTotalCount ? rootComments.Count : 0;
            var pagedRoots = rootComments
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedData<SearchUserCourseCommentQri>
            {
                QueryResult = pagedRoots,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        private async Task<bool> IsCourseStaffViewerAsync(long viewerUserId, bool viewerIsAdmin, CourseQueryModel course)
        {
            if (viewerIsAdmin) return true;
            if (viewerUserId <= 0) return false;

            if (course.Teacher?.UserId == viewerUserId)
                return true;

            if (course.TeacherId is null or <= 0)
                return false;

            return await _dbContext.Teachers
                .AsNoTracking()
                .AnyAsync(t => t.Id == course.TeacherId.Value && t.UserId == viewerUserId);
        }

        public async Task<CartRecommendationsQri> GetCartRecommendationsAsync(
            IReadOnlyList<long> courseIds,
            long? userId,
            CancellationToken cancellationToken = default)
        {
            var ids = (courseIds ?? Array.Empty<long>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var result = new CartRecommendationsQri
            {
                CartCourseCount = ids.Count,
                Suggestions = []
            };

            if (ids.Count == 0)
            {
                result.PathSize = 3;
                result.PathCompletionPercent = 0;
                return result;
            }

            var cartCourses = await _dbContext.Courses
                .AsNoTracking()
                .Include(c => c.Tags)
                .Include(c => c.Category)
                .Where(c => ids.Contains(c.CourseId))
                .Select(c => new
                {
                    c.CourseId,
                    c.CategoryId,
                    CategoryName = c.Category != null ? c.Category.Title : null,
                    TagNames = c.Tags.Select(t => t.TagName).ToList()
                })
                .ToListAsync(cancellationToken);

            var categoryIds = cartCourses
                .Where(c => c.CategoryId.HasValue && c.CategoryId.Value > 0)
                .Select(c => c.CategoryId!.Value)
                .Distinct()
                .ToList();

            var cartTags = cartCourses
                .SelectMany(c => c.TagNames)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var enrolledIds = new HashSet<long>();
            if (userId is > 0)
            {
                var studentId = await _dbContext.Students
                    .AsNoTracking()
                    .Where(s => s.UserId == userId.Value)
                    .Select(s => (long?)s.StudentId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (studentId is > 0)
                {
                    var enrolled = await _dbContext.Enrollments
                        .AsNoTracking()
                        .Where(e => e.StudentId == studentId.Value && e.IsActive)
                        .Select(e => e.CourseId)
                        .ToListAsync(cancellationToken);
                    enrolledIds = enrolled.ToHashSet();
                }
            }

            var excludeIds = ids.Concat(enrolledIds).Distinct().ToHashSet();

            IQueryable<CourseQueryModel> candidatesQuery = _dbContext.Courses
                .AsNoTracking()
                .Include(c => c.Category)
                .Include(c => c.Tags)
                .Include(c => c.Teacher!)
                .ThenInclude(t => t.User)
                .Where(c =>
                    c.IsPublish &&
                    c.ModerationStatus == TeacherApprovalStatus.Approved &&
                    c.Title != null &&
                    !excludeIds.Contains(c.CourseId));

            if (categoryIds.Count > 0)
            {
                candidatesQuery = candidatesQuery.Where(c =>
                    c.CategoryId.HasValue && categoryIds.Contains(c.CategoryId.Value));
            }

            var candidates = await candidatesQuery
                .OrderByDescending(c => c.CreateAt)
                .Take(40)
                .ToListAsync(cancellationToken);

            var scored = candidates
                .Select(c =>
                {
                    var tagOverlap = c.Tags?
                        .Select(t => t.TagName)
                        .Where(n => !string.IsNullOrWhiteSpace(n))
                        .Count(n => cartTags.Contains(n.Trim())) ?? 0;
                    var sameCategory = c.CategoryId.HasValue && categoryIds.Contains(c.CategoryId.Value) ? 1 : 0;
                    var score = tagOverlap * 10 + sameCategory * 5;
                    return new { Course = c, Score = score };
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Course.CreateAt)
                .Take(6)
                .ToList();

            result.Suggestions = scored.Select(x =>
            {
                var c = x.Course;
                var teacherName = string.Empty;
                if (c.Teacher?.User != null)
                {
                    teacherName = string.Join(
                        " ",
                        new[] { c.Teacher.User.FirstName, c.Teacher.User.LastName }
                            .Where(p => !string.IsNullOrWhiteSpace(p))
                            .Select(p => p!.Trim()));
                }

                return new CartRecommendationCourseQri
                {
                    Id = c.CourseId,
                    Title = c.Title ?? string.Empty,
                    Slug = CourseSlugHelper.FromTitle(c.Title, c.CourseId),
                    ShortDescription = c.Description,
                    TitleImage = c.LogoImage,
                    Price = c.Price ?? 0,
                    OriginalPrice = c.OriginalPrice,
                    CategoryName = c.Category?.Title ?? string.Empty,
                    CategoryId = c.CategoryId,
                    TeacherName = teacherName
                };
            }).ToList();

            var suggestionCount = result.Suggestions.Count;
            var pathSize = Math.Min(ids.Count + suggestionCount, Math.Max(ids.Count, 3));
            if (pathSize <= 0) pathSize = 3;
            result.PathSize = pathSize;
            result.PathCompletionPercent = (int)Math.Round(100.0 * ids.Count / pathSize);
            if (result.PathCompletionPercent > 100) result.PathCompletionPercent = 100;

            return result;
        }

    }

    public static class CourseLevelMapper
    {
        public static string ToDisplayName(this CourseLevel? level)
        {
            return level switch
            {
                CourseLevel.BEGINNER => "Beginner",
                CourseLevel.INTERMEDIATE => "Intermediate",
                CourseLevel.ADVANCED => "Advanced",
                _ => "Unknown"
            };
        }
        public static string ToDisplayStatus(this CourseStatus? status)
        {
            return status switch
            {
                CourseStatus.PAID => "Paid",
                CourseStatus.FREE => "Free",
                _ => "Unknown"
            };
        }
    }

}
