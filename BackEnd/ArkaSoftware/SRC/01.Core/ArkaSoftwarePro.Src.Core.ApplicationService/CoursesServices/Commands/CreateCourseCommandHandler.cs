using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using Newtonsoft.Json;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Core.RequestResponse.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
public class CreateCourseCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ITeacherQueryRepository teacherQueryRepository,
    ITeacherCommandRepository teacherCommandRepository,
    ICourseCommandRepository courseCommandRepository,
    IMediaUploadSettingsCommandRepository mediaUploadSettingsRepository,
    IConfiguration configuration,
    IEntityTitleUniquenessChecker titleUniquenessChecker,
    TeacherXpService teacherXpService,
    TeacherFollowNotifier teacherFollowNotifier,
    TeacherContentNotifier contentNotifier,
    CourseLessonVideoUploadService courseLessonVideoUploadService,
    CourseVideoStorageService courseVideoStorageService,
    UserEmailVerificationGuard emailVerificationGuard,
    IHttpContextAccessor httpContextAccessor,
    ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
    : CommandHandler<AddCourse, string>(mafiaOuterServices)
    {
        private const int MaxTagLength = 100;
        private const int MaxDependencyTitleLength = 100;
        private CourseStatus _courseStatus;
        private string _courseTitleImage = string.Empty;
        public override async Task<CommandResult<string>> Handle(AddCourse command)
        {
            if (command.UserId > 0)
            {
                var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(command.UserId);
                if (!emailCheck.Ok)
                {
                    AddMessage(emailCheck.Message);
                    return await ResultAsync(emailCheck.Message, ApplicationServiceStatus.ValidationError);
                }
            }

            long teacherId = command.TeacherId;
            if (command.UserId > 0)
            {
                var foundId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.UserId);
                if (foundId.HasValue) teacherId = foundId.Value;
                else return await ResultAsync("Teacher account not found for this user." , ApplicationServiceStatus.NotFound);
            }

            if (await titleUniquenessChecker.CourseTitleExistsAsync(command.Title))
            {
                AddMessage("A course with this title already exists.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
            }

            string titleImageResultAsync;
            if (command.TitleImage != null && command.TitleImage.Length > 0 && !string.IsNullOrEmpty(command.TitleImage.FileName))
            {
                titleImageResultAsync = await fileStoragePathSaver.SavePublicAsync(command.TitleImage, "images/courses");
            }
            else if (!string.IsNullOrWhiteSpace(command.TitleImageUrl))
            {
                titleImageResultAsync = NormalizePublicUrl(command.TitleImageUrl!);
            }
            else
            {
                AddMessage("Course title image is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            var fullImagePath = GetFullImagePath(titleImageResultAsync);

            _courseStatus = command.CoursePrice == 0 ? CourseStatus.FREE : CourseStatus.PAID;

            if (!CourseOriginalPriceRules.TryNormalize(command.CoursePrice, command.OriginalPrice, out var normalizedOriginalPrice, out var originalPriceError))
            {
                AddMessage(originalPriceError!);
                return await ResultAsync(string.Empty, ApplicationServiceStatus.InvalidDomainState);
            }

            var lifecyclePhase = CourseLifecycleDateParser.ParsePhase(command.LifecyclePhase);
            var deliveryMode = CourseDeliveryModeParser.Parse(command.DeliveryMode);
            var scheduleEditable = CourseLifecycleRules.CanEditLifecycleSchedule(lifecyclePhase);
            var canUploadLessonVideos = CourseLifecycleRules.CanUploadLessonVideos(deliveryMode, lifecyclePhase);

            Course course = new(
                new Title(command.Title),
                _courseStatus,
                new Price(command.CoursePrice),
                new Image(fullImagePath),
                new Description(command.Description ?? ""),
                new LongDescription(command.LongDescription ?? ""),
                ((CourseLevel)Enum.Parse(typeof(CourseLevel), command.CourseLevel!.ToUpperInvariant() ?? "")) , 
                command.CategoryId,
                teacherId,
                command.IsPublish,
                command.IsCertificate,
                deliveryMode,
                null, // SpotPlayer retired
                lifecyclePhase,
                scheduleEditable ? CourseLifecycleDateParser.ParseUtc(command.RegistrationDeadlineUtc) : null,
                scheduleEditable ? CourseLifecycleDateParser.ParseUtc(command.CourseStartUtc) : null,
                scheduleEditable ? CourseLifecycleDateParser.ParseUtc(command.CourseEndUtc) : null);

            course.SetCourseLanguage(command.Language);
            course.SetRegistrationClosed(command.IsRegistrationClosed);
            course.SetOriginalPrice(normalizedOriginalPrice.HasValue ? new Price(normalizedOriginalPrice.Value) : null);

            if (!CoursePaymentConfigurator.TryApply(course, command.PaymentType, command.InstallmentPlansJson, out var paymentError))
            {
                AddMessage(paymentError ?? "Invalid payment configuration.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.InvalidDomainState);
            }

            var sessions = CourseLessonSessionMapper.DeserializeSessions(command.SessionsJson);
            CourseLessonSessionMapper.SanitizeIncomingSessions(sessions, deliveryMode, lifecyclePhase);
            var defaultPublishLessons = lifecyclePhase == CourseLifecyclePhase.Ended;

            foreach (var session in sessions)
            {
                var lessonDtos = session.Lessons ?? [];
                var lessons = lessonDtos
                    .Where(l => !string.IsNullOrWhiteSpace(l.Title))
                    .Select((l, lessonIndex) =>
                    {
                        var lesson = new CourseLesson(new Title(l.Title!), lessonIndex);
                        if (canUploadLessonVideos)
                        {
                            if (l.MediaAssetId is > 0)
                            {
                                lesson.SetEncryptedLessonVideo(
                                    l.VideoTitle ?? l.Title,
                                    l.MediaAssetId.Value,
                                    l.DurationSeconds ?? 0);
                            }
                            else if (!string.IsNullOrWhiteSpace(l.VideoUrl))
                            {
                                lesson.SetLessonVideo(l.VideoTitle ?? l.Title, l.VideoUrl, l.DurationSeconds ?? 0);
                            }
                        }

                        var isPublished = lifecyclePhase == CourseLifecyclePhase.InProgress
                            ? l.IsPublished ?? false
                            : defaultPublishLessons;
                        lesson.SetPublished(isPublished);
                        return lesson;
                    })
                    .ToList();
                course.AddCourseSession(new Title(session.Title ?? ""), lessons);
            }

            var tags = NormalizeTags(ParseStringList(command.KeywordsJson));
            var dependencies = NormalizeDependencies(ParseStringList(command.DependenciesJson));
            dependencies.ForEach(course.AddCourseDependencies);
            var questions = JsonConvert.DeserializeObject<List<CourseFaqDto>>(command.QuestionJson ?? "[]") ?? [];
            questions.ForEach(x => course.AddCourseFaq(x.Question ?? "", x.Answer!));

            if (command.VideoInfo != null && command.VideoInfo.Length > 0 && !string.IsNullOrEmpty(command.VideoInfo.FileName))
            {
                var maxSeconds = await MediaUploadDurationGuard
                    .GetCourseIntroLimitAsync(mediaUploadSettingsRepository);
                if (!MediaUploadDurationGuard.TryResolveDuration(
                        command.IntroVideoDurationSeconds,
                        maxSeconds,
                        out var introDuration,
                        out var durationError))
                {
                    AddMessage(durationError!);
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                }

                var extension = Path.GetExtension(command.VideoInfo.FileName);
                if (string.IsNullOrWhiteSpace(extension)) extension = ".mp4";
                string videoSaveResultAsync = await courseVideoStorageService.SaveIntroFromUploadAsync(
                    command.VideoInfo,
                    command.Title);
                course.AddCourseVideo("intro", videoSaveResultAsync, introDuration);
            }
            else if (!string.IsNullOrWhiteSpace(command.VideoInfoUrl))
            {
                try
                {
                    var maxSeconds = await MediaUploadDurationGuard
                        .GetCourseIntroLimitAsync(mediaUploadSettingsRepository);
                    if (!MediaUploadDurationGuard.TryResolveDuration(
                            command.IntroVideoDurationSeconds,
                            maxSeconds,
                            out var introDuration,
                            out var durationError))
                    {
                        AddMessage(durationError!);
                        return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                    }

                    var videoPath = await courseVideoStorageService.ResolveIntroPathAsync(
                        command.VideoInfoUrl,
                        command.Title);
                    var extension = Path.GetExtension(videoPath);
                    if (string.IsNullOrWhiteSpace(extension)) extension = ".mp4";
                    course.AddCourseVideo("intro", videoPath, introDuration);
                }
                catch (Exception ex)
                {
                    AddMessage(ex.Message);
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                }
            }
            else
            {
                AddMessage("Course intro video is required.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
            }

            course.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
            course.ApplyModerationOnSave(command.IsPublish, isAdmin);
            foreach (var lesson in course.GetAllLessons())
            {
                lesson.ApplyVideoModerationOnSave(
                    lesson.VideoPath != null,
                    lesson.IsPublished,
                    isAdmin,
                    videoChanged: lesson.VideoPath != null);
            }

            await courseCommandRepository.InsertAsync(course);
            await courseCommandRepository.CommitAsync();
            await courseLessonVideoUploadService.ApplyUploadsAsync(
                course,
                sessions,
                httpContextAccessor.HttpContext?.Request,
                isAdmin);
            await courseLessonVideoUploadService.RelocatePlainLessonVideosAsync(course);
            await courseCommandRepository.CommitAsync();
            await courseCommandRepository.SyncTagsAsync(course.Id, tags);
            await courseCommandRepository.CommitAsync();

            if (command.IsPublish && teacherId > 0)
            {
                var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId);
                if (teacher != null)
                {
                    var displayName = teacher.User != null
                        ? $"{teacher.User.UserFullName?.FirstName} {teacher.User.UserFullName?.LastName}".Trim()
                        : "Teacher";
                    var courseTitle = course.Title?.Value ?? string.Empty;

                    if (isAdmin)
                    {
                        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
                        await teacherXpService.TryAwardOnceAsync(
                            teacher,
                            settings.XpRewardPublishCourse,
                            TeacherXpEventReason.PublishCourse,
                            course.Id);
                        await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                            teacher.Id,
                            teacher.UserId,
                            "teacher_new_course",
                            displayName,
                            courseTitle,
                            $"/courses/{CourseSlugHelper.FromTitle(courseTitle, course.Id)}",
                            course.Id);
                    }
                    else
                    {
                        await contentNotifier.NotifyAdminsContentSubmittedAsync(
                            teacher.Id,
                            displayName,
                            "course",
                            courseTitle);
                    }
                }
            }

            return await OkAsync($"Courses Is Added Success.");
        }

        private string GetFullImagePath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return string.Empty;

            if (Uri.TryCreate(relativePath, UriKind.Absolute, out var absoluteUri))
                return absoluteUri.ToString();

            if (!relativePath.StartsWith("/"))
                relativePath = "/" + relativePath;

            var baseUrl = configuration["BaseUrl"]?.Trim();  // مثلا: "https://localhost:5001/api"
            if (string.IsNullOrWhiteSpace(baseUrl))
                return relativePath;

            return $"{baseUrl.TrimEnd('/')}{relativePath}";
        }

        private static string ToPublicWebPath(string savedPath)
        {
            if (string.IsNullOrWhiteSpace(savedPath))
                return string.Empty;

            var normalized = savedPath.Replace("\\", "/");
            var webRootIndex = normalized.LastIndexOf("/wwwroot/", StringComparison.OrdinalIgnoreCase);

            if (webRootIndex >= 0)
                normalized = normalized[(webRootIndex + "/wwwroot".Length)..];
            else if (normalized.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
                normalized = normalized["wwwroot".Length..];

            if (!normalized.StartsWith("/"))
                normalized = "/" + normalized;

            return normalized;
        }

        private static string NormalizePublicUrl(string url)
        {
            var trimmed = url.Trim();
            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
                return absolute.AbsolutePath;

            return trimmed.StartsWith('/') ? trimmed : "/" + trimmed;
        }

        private static List<string> ParseStringList(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<string>();

            try
            {
                var list = JsonConvert.DeserializeObject<List<string>>(json);
                if (list != null)
                    return list;
            }
            catch
            {
                // Fall through and treat the payload as plain text.
            }

            return new List<string> { json };
        }

        private static List<string> NormalizeTags(IEnumerable<string?> rawTags)
        {
            return rawTags
                .SelectMany(SplitLooseList)
                .Select(tag => tag.Trim().TrimStart('#'))
                .Where(tag => tag.Length >= 2)
                .Select(tag => tag.Length > MaxTagLength ? tag[..MaxTagLength].Trim() : tag)
                .Where(tag => tag.Length >= 2)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static List<string> NormalizeDependencies(IEnumerable<string?> rawDependencies)
        {
            return rawDependencies
                .SelectMany(SplitLooseList)
                .Select(item => item.Trim())
                .Where(item => item.Length > 0)
                .Select(item => item.Length > MaxDependencyTitleLength ? item[..MaxDependencyTitleLength].Trim() : item)
                .Where(item => item.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static IEnumerable<string> SplitLooseList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return Array.Empty<string>();

            return Regex
                .Split(value, @"[\r\n;؛,،]+")
                .Select(x => x.Trim())
                .Where(x => x.Length > 0);
        }

    }
}
