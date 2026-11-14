using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using Framework.Src.Utilities.OutService.Extensions;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

internal static class CourseLessonSessionMapper
{
    private static readonly JsonSerializerSettings SessionJsonSettings = new()
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
    };

    public static List<CourseSessionDto> DeserializeSessions(string? sessionsJson) =>
        JsonConvert.DeserializeObject<List<CourseSessionDto>>(sessionsJson ?? "[]", SessionJsonSettings) ?? [];

    public static List<(long SectionId, string Title, IReadOnlyList<Course.CourseLessonReplaceItem> Lessons)> MapSessions(
        IEnumerable<CourseSessionDto> sessions,
        CourseDeliveryMode deliveryMode,
        CourseLifecyclePhase lifecyclePhase) =>
        sessions
            .Where(s => !string.IsNullOrWhiteSpace(s.Title))
            .Select(s =>
            {
                _ = long.TryParse(s.Id, out var sectionId);
                return (
                    SectionId: sectionId > 0 ? sectionId : 0L,
                    Title: s.Title!.Trim(),
                    Lessons: (IReadOnlyList<Course.CourseLessonReplaceItem>)(s.Lessons ?? [])
                        .Where(l => !string.IsNullOrWhiteSpace(l.Title))
                        .Select((l, lessonIndex) =>
                        {
                            _ = long.TryParse(l.Id, out var lessonId);
                            var canUpload = CourseLifecycleRules.CanUploadLessonVideos(deliveryMode, lifecyclePhase);
                            var canRetain = CourseLifecycleRules.CanRetainLessonVideos(deliveryMode, lifecyclePhase);
                            var mediaAssetId = ResolveMediaAssetId(l);
                            var isArkaDesktop = deliveryMode is CourseDeliveryMode.DesktopLicense
                                or CourseDeliveryMode.SpotPlayerLicense;
                            var keepExisting = canRetain &&
                                               !l.RemoveVideo &&
                                               lessonId > 0 &&
                                               mediaAssetId is null &&
                                               (isArkaDesktop
                                                   ? string.IsNullOrWhiteSpace(l.VideoUrl)
                                                     || l.VideoUrl.StartsWith("drm://", StringComparison.OrdinalIgnoreCase)
                                                   : string.IsNullOrWhiteSpace(l.VideoUrl));
                            var videoUrl = canUpload && !isArkaDesktop
                                ? l.VideoUrl
                                : mediaAssetId is > 0
                                    ? $"drm://media/{mediaAssetId.Value}"
                                    : null;
                            var isPublished = lifecyclePhase == CourseLifecyclePhase.InProgress
                                ? l.IsPublished
                                : lifecyclePhase == CourseLifecyclePhase.Ended
                                    ? l.IsPublished ?? true
                                    : false;

                            return new Course.CourseLessonReplaceItem(
                                lessonId,
                                l.Title!.Trim(),
                                l.VideoTitle,
                                videoUrl,
                                l.DurationSeconds ?? 0,
                                keepExisting,
                                isPublished,
                                mediaAssetId);
                        })
                        .ToList()
                );
            })
            .ToList();

    private static long? ResolveMediaAssetId(CourseLessonDto lesson)
    {
        if (lesson.MediaAssetId is > 0)
            return lesson.MediaAssetId;

        var url = lesson.VideoUrl?.Trim();
        if (string.IsNullOrWhiteSpace(url))
            return null;

        const string prefix = "drm://media/";
        if (url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            && long.TryParse(url[prefix.Length..], out var id)
            && id > 0)
            return id;

        return null;
    }

    public static void SanitizeIncomingSessions(
        List<CourseSessionDto> sessions,
        CourseDeliveryMode deliveryMode,
        CourseLifecyclePhase lifecyclePhase)
    {
        if (CourseLifecycleRules.CanUploadLessonVideos(deliveryMode, lifecyclePhase))
            return;

        foreach (var session in sessions)
        {
            foreach (var lesson in session.Lessons ?? [])
            {
                if (deliveryMode is CourseDeliveryMode.DesktopLicense or CourseDeliveryMode.SpotPlayerLicense)
                    lesson.VideoUrl = null;
                else if (!CourseLifecycleRules.CanUploadLessonVideos(deliveryMode, lifecyclePhase))
                    lesson.VideoUrl = null;
                if (!CourseLifecycleRules.CanRetainLessonVideos(deliveryMode, lifecyclePhase))
                    lesson.RemoveVideo = true;
            }
        }
    }
}

internal static class CourseLessonVideoUploader
{
    public static async Task ApplyUploadsAsync(
        Course course,
        IReadOnlyList<CourseSessionDto> sessions,
        HttpRequest? request)
    {
        if (request == null)
            return;

        if (!CourseLifecycleRules.CanUploadLessonVideos(course.DeliveryMode, course.LifecyclePhase))
            return;

        var uploadMap = request.Form.Files
            .Where(f => f.Length > 0 && f.Name.StartsWith("lessonVideo_", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(f => f.Name["lessonVideo_".Length..], f => f, StringComparer.OrdinalIgnoreCase);

        if (uploadMap.Count == 0)
            return;

        var lessonsInOrder = course.GetAllLessons().ToList();
        var dtoLessons = sessions
            .SelectMany(s => s.Lessons ?? [])
            .Where(l => !string.IsNullOrWhiteSpace(l.Title))
            .ToList();

        for (var i = 0; i < dtoLessons.Count && i < lessonsInOrder.Count; i++)
        {
            var dto = dtoLessons[i];
            var lesson = lessonsInOrder[i];
            var key = dto.Id ?? $"idx-{i}";
            if (!uploadMap.TryGetValue(key, out var file))
                continue;

            var duration = dto.DurationSeconds ?? ParseDuration(request, key);
            var videoTitle = string.IsNullOrWhiteSpace(dto.VideoTitle) ? dto.Title : dto.VideoTitle;
            var relativePath = await SaveLessonVideoAsync(course.Id, lesson.Id, file);
            lesson.SetLessonVideo(videoTitle, relativePath, duration);
        }
    }

    private static int ParseDuration(HttpRequest request, string key)
    {
        var raw = request.Form[$"lessonVideoDuration_{key}"].FirstOrDefault();
        return int.TryParse(raw, out var seconds) ? Math.Max(0, seconds) : 0;
    }

    private static async Task<string> SaveLessonVideoAsync(long courseId, long lessonId, IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
            extension = ".mp4";

        var folder = $"wwwroot/videos/courses/{courseId}/lessons";
        var fileName = $"{lessonId}{extension}";
        var savedPath = await file.SaveToPathAsync(folder, fileName);
        return ToPublicWebPath(savedPath);
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

        if (!normalized.StartsWith('/'))
            normalized = "/" + normalized;

        return normalized;
    }
}

internal static class CourseLessonDurationFormatter
{
    public static string Format(int seconds)
    {
        if (seconds <= 0)
            return "0m";

        var span = TimeSpan.FromSeconds(seconds);
        if (span.TotalHours >= 1)
            return $"{(int)span.TotalHours}h {span.Minutes}m";

        return span.TotalMinutes < 1 ? $"{seconds}s" : $"{(int)span.TotalMinutes}m";
    }
}
