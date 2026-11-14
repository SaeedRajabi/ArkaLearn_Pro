using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseCurriculumMaterialRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.UpdateCourses;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class UpdateCourseCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ICourseCommandRepository courseCommandRepository,
    ICourseCurriculumMaterialCommandRepository materialCommandRepository,
    IMediaUploadSettingsCommandRepository mediaUploadSettingsRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IConfiguration configuration,
    IEntityTitleUniquenessChecker titleUniquenessChecker,
    TeacherXpService teacherXpService,
    TeacherFollowNotifier teacherFollowNotifier,
    TeacherContentNotifier contentNotifier,
    INewsletterPublishNotifier newsletterPublishNotifier,
    CourseLessonVideoUploadService courseLessonVideoUploadService,
    CourseVideoStorageService courseVideoStorageService,
    IHttpContextAccessor httpContextAccessor,
    ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
    : CommandHandler<UpdateCourse, string>(mafiaOuterServices)
{
    private const int MaxTagLength = 100;
    private const int MaxDependencyTitleLength = 100;

    public override async Task<CommandResult<string>> Handle(UpdateCourse command)
    {
        var course = await courseCommandRepository.GetCourseForEditAsync(command.CourseId);
        if (course == null)
            return await ResultAsync($"Course With Id: {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

        var wasPublished = course.IsPublish;

        if (await titleUniquenessChecker.CourseTitleExistsAsync(command.Title, command.CourseId))
        {
            AddMessage("A course with this title already exists.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
        }

        var status = command.CoursePrice == 0 ? CourseStatus.FREE : CourseStatus.PAID;
        var level = ParseCourseLevel(command.CourseLevel);

        if (!CourseOriginalPriceRules.TryNormalize(command.CoursePrice, command.OriginalPrice, out var normalizedOriginalPrice, out var originalPriceError))
        {
            AddMessage(originalPriceError!);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.InvalidDomainState);
        }

        var lifecyclePhase = CourseLifecycleDateParser.ParsePhase(command.LifecyclePhase);
        var deliveryMode = CourseDeliveryModeParser.Parse(command.DeliveryMode);
        var scheduleEditable = CourseLifecycleRules.CanEditLifecycleSchedule(lifecyclePhase);

        course.UpdateAdminDetails(
            new Title(command.Title),
            status,
            new Price(command.CoursePrice),
            new Description(command.Description ?? ""),
            new LongDescription(command.LongDescription ?? ""),
            level,
            command.CategoryId,
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

        course.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);
        course.ApplyModerationOnSave(command.IsPublish, isAdmin);

        if (command.TitleImage != null && command.TitleImage.Length > 0 && !string.IsNullOrEmpty(command.TitleImage.FileName))
        {
            var titleImagePath = await fileStoragePathSaver.SavePublicAsync(command.TitleImage, "images/courses");
            course.ChangeCourseTitleImage(titleImagePath);
        }
        else if (!string.IsNullOrWhiteSpace(command.TitleImageUrl))
        {
            course.ChangeCourseTitleImage(NormalizePublicUrl(command.TitleImageUrl!));
        }

        var sessions = CourseLessonSessionMapper.DeserializeSessions(command.SessionsJson);
        CourseLessonSessionMapper.SanitizeIncomingSessions(sessions, deliveryMode, lifecyclePhase);

        var materials = await materialCommandRepository.ListActiveByCourseAsync(course.Id);
        var sectionSnapshot = course.CourseSessions
            .Select((section, index) => new SectionIdSnapshot(
                index,
                section.Id,
                section.CourseLessons
                    .OrderBy(l => l.SortOrder)
                    .ThenBy(l => l.Id)
                    .Select((lesson, lessonIndex) => new LessonIdSnapshot(lessonIndex, lesson.Id))
                    .ToList()))
            .ToList();

        course.ReplaceSessions(CourseLessonSessionMapper.MapSessions(sessions, deliveryMode, lifecyclePhase), isAdmin);

        var tags = NormalizeTags(ParseStringList(command.KeywordsJson));
        var dependencies = NormalizeDependencies(ParseStringList(command.DependenciesJson));
        course.ReplaceDependencies(dependencies);

        var questions = JsonConvert.DeserializeObject<List<CourseFaqDto>>(command.QuestionJson ?? "[]") ?? [];
        course.ReplaceFaqs(questions
            .Where(x => !string.IsNullOrWhiteSpace(x.Question))
            .Select(x => (x.Question ?? "", x.Answer ?? ""))
            .ToList());

        await courseCommandRepository.CommitAsync();

        await RemapCurriculumMaterialsAsync(course, materials, sectionSnapshot);

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
            var videoSavePath = await courseVideoStorageService.SaveIntroFromUploadAsync(
                command.VideoInfo,
                course.Title?.Value ?? command.Title ?? "course");
            course.ReplaceIntroVideo(extension, videoSavePath, introDuration);
        }
        else if (!string.IsNullOrWhiteSpace(command.VideoInfoUrl))
        {
            var incomingIntroUrl = command.VideoInfoUrl.Trim();
            // Legacy bad intros (desktop-encrypted) must not block other course field updates.
            if (incomingIntroUrl.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
            {
                // Keep existing intro as-is; admin/teacher must re-upload a public intro video.
            }
            else
            {
                var existingIntroPath = course.CourseVideos
                    .Select(v => v.VideoPath?.Value)
                    .FirstOrDefault(p => !string.IsNullOrWhiteSpace(p))
                    ?.Trim();

                var incomingNormalized = NormalizeComparablePath(incomingIntroUrl);
                var existingNormalized = NormalizeComparablePath(existingIntroPath);
                var introUnchanged = !string.IsNullOrWhiteSpace(existingNormalized)
                    && string.Equals(incomingNormalized, existingNormalized, StringComparison.OrdinalIgnoreCase);

                if (!introUnchanged)
                {
                    try
                    {
                        var maxSeconds = await MediaUploadDurationGuard
                            .GetCourseIntroLimitAsync(mediaUploadSettingsRepository);
                        if (!MediaUploadDurationGuard.TryResolveDuration(
                                command.IntroVideoDurationSeconds,
                                maxSeconds,
                                out var introDuration,
                                out var durationError,
                                course.CourseVideos.FirstOrDefault()?.Duration))
                        {
                            AddMessage(durationError!);
                            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                        }

                        var videoPath = await courseVideoStorageService.ResolveIntroPathAsync(
                            incomingIntroUrl,
                            course.Title?.Value ?? command.Title ?? "course");
                        var extension = Path.GetExtension(videoPath);
                        if (string.IsNullOrWhiteSpace(extension)) extension = ".mp4";
                        course.ReplaceIntroVideo(extension, videoPath, introDuration);
                    }
                    catch (Exception ex)
                    {
                        AddMessage(ex.Message);
                        return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                    }
                }
            }
        }

        await courseLessonVideoUploadService.ApplyUploadsAsync(
            course,
            sessions,
            httpContextAccessor.HttpContext?.Request,
            isAdmin);

        await courseLessonVideoUploadService.RelocatePlainLessonVideosAsync(course);

        await courseCommandRepository.CommitAsync();
        await courseCommandRepository.SyncTagsAsync(course.Id, tags);
        await courseCommandRepository.CommitAsync();

        if (command.IsPublish && course.TeacherId.HasValue && course.TeacherId.Value > 0)
        {
            var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(course.TeacherId.Value);
            if (teacher != null)
            {
                var displayName = teacher.User != null
                    ? $"{teacher.User.UserFullName?.FirstName} {teacher.User.UserFullName?.LastName}".Trim()
                    : "Teacher";
                var courseTitle = course.Title?.Value ?? string.Empty;

                if (isAdmin && !wasPublished)
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
                    await newsletterPublishNotifier.NotifyContentPublishedAsync(
                        NewsletterContentKind.Course,
                        courseTitle,
                        $"/courses/{CourseSlugHelper.FromTitle(courseTitle, course.Id)}",
                        teacher.Id,
                        teacher.UserId,
                        displayName);
                }
                else if (!isAdmin)
                {
                    await contentNotifier.NotifyAdminsContentSubmittedAsync(
                        teacher.Id,
                        displayName,
                        "course",
                        courseTitle);
                }
            }
        }

        return await OkAsync("Course updated successfully.");
    }

    private async Task RemapCurriculumMaterialsAsync(
        Course course,
        List<CourseCurriculumMaterial> materials,
        IReadOnlyList<SectionIdSnapshot> sectionSnapshot)
    {
        if (materials.Count == 0)
            return;

        var newSections = course.CourseSessions.ToList();
        if (newSections.Count == 0)
            return;

        var currentSectionIds = newSections.Select(s => s.Id).Where(id => id > 0).ToHashSet();
        var sectionMap = new Dictionary<long, long>();
        var lessonMap = new Dictionary<long, long>();

        for (var i = 0; i < sectionSnapshot.Count && i < newSections.Count; i++)
        {
            var old = sectionSnapshot[i];
            sectionMap[old.SectionId] = newSections[i].Id;

            var newLessons = newSections[i].CourseLessons
                .OrderBy(l => l.SortOrder)
                .ThenBy(l => l.Id)
                .ToList();
            for (var j = 0; j < old.Lessons.Count && j < newLessons.Count; j++)
                lessonMap[old.Lessons[j].LessonId] = newLessons[j].Id;
        }

        // Recover materials orphaned by previous clear-and-recreate session saves.
        var orphanSectionIds = materials
            .Select(m => m.CourseSectionId)
            .Where(id => !sectionMap.ContainsKey(id) && !currentSectionIds.Contains(id))
            .Distinct()
            .OrderBy(id => id)
            .ToList();

        for (var k = 0; k < orphanSectionIds.Count && k < newSections.Count; k++)
        {
            sectionMap[orphanSectionIds[k]] = newSections[k].Id;
            var orphanLessonIds = materials
                .Where(m => m.CourseSectionId == orphanSectionIds[k] && m.CourseLessonId is > 0)
                .Select(m => m.CourseLessonId!.Value)
                .Distinct()
                .OrderBy(id => id)
                .ToList();
            var newLessons = newSections[k].CourseLessons
                .OrderBy(l => l.SortOrder)
                .ThenBy(l => l.Id)
                .ToList();
            for (var j = 0; j < orphanLessonIds.Count && j < newLessons.Count; j++)
                lessonMap[orphanLessonIds[j]] = newLessons[j].Id;
        }

        var changed = false;
        foreach (var material in materials)
        {
            if (currentSectionIds.Contains(material.CourseSectionId)
                && (material.CourseLessonId is null
                    || newSections.SelectMany(s => s.CourseLessons).Any(l => l.Id == material.CourseLessonId)))
            {
                continue;
            }

            if (!sectionMap.TryGetValue(material.CourseSectionId, out var newSectionId) || newSectionId <= 0)
                continue;

            long? newLessonId = null;
            if (material.CourseLessonId is long oldLessonId)
            {
                if (!lessonMap.TryGetValue(oldLessonId, out var mappedLesson) || mappedLesson <= 0)
                    continue;
                newLessonId = mappedLesson;
            }

            if (material.CourseSectionId == newSectionId && material.CourseLessonId == newLessonId)
                continue;

            material.RemapTargets(newSectionId, newLessonId);
            changed = true;
        }

        if (changed)
            await materialCommandRepository.CommitAsync();
    }

    private sealed record LessonIdSnapshot(int Index, long LessonId);
    private sealed record SectionIdSnapshot(int Index, long SectionId, IReadOnlyList<LessonIdSnapshot> Lessons);

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
            return [];

        try
        {
            var list = JsonConvert.DeserializeObject<List<string>>(json);
            if (list != null)
                return list;
        }
        catch
        {
            /* plain text fallback */
        }

        return [json];
    }

    private static List<string> NormalizeTags(IEnumerable<string?> rawTags) =>
        rawTags
            .SelectMany(SplitLooseList)
            .Select(tag => tag.Trim().TrimStart('#'))
            .Where(tag => tag.Length >= 2)
            .Select(tag => tag.Length > MaxTagLength ? tag[..MaxTagLength].Trim() : tag)
            .Where(tag => tag.Length >= 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static List<string> NormalizeDependencies(IEnumerable<string?> rawDependencies) =>
        rawDependencies
            .SelectMany(SplitLooseList)
            .Select(item => item.Trim())
            .Where(item => item.Length > 0)
            .Select(item => item.Length > MaxDependencyTitleLength ? item[..MaxDependencyTitleLength].Trim() : item)
            .Where(item => item.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static CourseLevel ParseCourseLevel(string? level)
    {
        var normalized = (level ?? "beginner").Trim().ToLowerInvariant();
        return normalized switch
        {
            "intermediate" => CourseLevel.INTERMEDIATE,
            "advanced" => CourseLevel.ADVANCED,
            "beginner" => CourseLevel.BEGINNER,
            _ => Enum.TryParse<CourseLevel>(normalized.ToUpperInvariant(), true, out var parsed)
                ? parsed
                : CourseLevel.BEGINNER,
        };
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

    private static string NormalizeComparablePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return string.Empty;

        var value = path.Trim();
        if (Uri.TryCreate(value, UriKind.Absolute, out var absolute))
            value = absolute.AbsolutePath;

        value = value.Replace('\\', '/');
        while (value.Contains("//", StringComparison.Ordinal))
            value = value.Replace("//", "/", StringComparison.Ordinal);

        if (value.StartsWith("/public/", StringComparison.OrdinalIgnoreCase))
            value = value["/public".Length..];

        return value.TrimStart('/').ToLowerInvariant();
    }
}
