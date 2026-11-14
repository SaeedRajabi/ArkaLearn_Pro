using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public sealed class CourseLessonVideoUploadService(
    IMediaAssetCommandRepository mediaAssetRepository,
    IMediaEncryptionService encryptionService,
    ITeacherQueryRepository teacherQueryRepository,
    IHostEnvironment hostEnvironment,
    IVideoWatermarkProcessor watermarkProcessor,
    IFileStorage fileStorage,
    CourseVideoStorageService courseVideoStorageService)
{
    private string ResolveWebRoot()
    {
        var contentRootWww = Path.Combine(hostEnvironment.ContentRootPath, "wwwroot");
        if (Directory.Exists(contentRootWww))
            return contentRootWww;

        var cwdWww = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        if (Directory.Exists(cwdWww))
            return cwdWww;

        return hostEnvironment.ContentRootPath;
    }

    public async Task ApplyUploadsAsync(
        Course course,
        IReadOnlyList<CourseSessionDto> sessions,
        HttpRequest? request,
        bool isAdmin = false,
        CancellationToken cancellationToken = default)
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

        var dtoLessons = sessions
            .SelectMany(s => s.Lessons ?? [])
            .Where(l => !string.IsNullOrWhiteSpace(l.Title))
            .ToList();

        var ownerUserId = await ResolveOwnerUserIdAsync(course.TeacherId, cancellationToken);
        if (ownerUserId <= 0)
            throw new InvalidOperationException("Teacher user was not found; cannot upload lesson videos.");

        var flatFallbackLessons = course.GetAllLessonsInSectionOrder().ToList();

        for (var i = 0; i < dtoLessons.Count; i++)
        {
            var dto = dtoLessons[i];
            var key = dto.Id ?? $"idx-{i}";
            if (!uploadMap.TryGetValue(key, out var file))
                continue;

            CourseLesson? lesson = null;
            if (long.TryParse(dto.Id, out var lessonId) && lessonId > 0)
                lesson = course.FindLesson(lessonId);

            if (lesson is null && i < flatFallbackLessons.Count)
                lesson = flatFallbackLessons[i];

            if (lesson is null)
                continue;

            var duration = dto.DurationSeconds ?? ParseDuration(request, key);
            var videoTitle = string.IsNullOrWhiteSpace(dto.VideoTitle) ? dto.Title : dto.VideoTitle;

            if (course.DeliveryMode is CourseDeliveryMode.DesktopLicense or CourseDeliveryMode.SpotPlayerLicense)
            {
                var mediaAssetId = await UploadEncryptedLessonAsync(
                    course.Id,
                    lesson.Id,
                    ownerUserId,
                    file,
                    videoTitle,
                    cancellationToken);
                if (mediaAssetId > 0)
                {
                    lesson.SetEncryptedLessonVideo(videoTitle, mediaAssetId, duration);
                    lesson.ApplyVideoModerationOnSave(
                        hasVideo: true,
                        isPublished: lesson.IsPublished,
                        isAdmin: isAdmin,
                        videoChanged: true);
                }
            }
            else
            {
                var sectionTitle = course.CourseSessions
                    .FirstOrDefault(s => s._courseLessons.Any(l => ReferenceEquals(l, lesson) || l.Id == lesson.Id))
                    ?.SessionTitle?.Value ?? "section";
                var relativePath = await courseVideoStorageService.SavePlainLessonFromUploadAsync(
                    file,
                    course.Title?.Value ?? $"course-{course.Id}",
                    sectionTitle,
                    videoTitle ?? lesson.LessonTitle?.Value ?? $"lesson-{lesson.Id}",
                    lesson.Id > 0 ? lesson.Id : null,
                    cancellationToken);
                lesson.SetLessonVideo(videoTitle, relativePath, duration);
                lesson.ApplyVideoModerationOnSave(
                    hasVideo: true,
                    isPublished: lesson.IsPublished,
                    isAdmin: isAdmin,
                    videoChanged: true);
            }
        }
    }

    /// <summary>
    /// Moves plain (non-DRM) lesson videos that still live under /media/... into
    /// videos/courses/{course}/{section}/{lesson}.mp4
    /// </summary>
    public async Task RelocatePlainLessonVideosAsync(Course course, CancellationToken cancellationToken = default)
    {
        if (course.DeliveryMode is CourseDeliveryMode.DesktopLicense or CourseDeliveryMode.SpotPlayerLicense)
            return;

        var courseTitle = course.Title?.Value ?? $"course-{course.Id}";
        foreach (var section in course.CourseSessions)
        {
            var sectionTitle = section.SessionTitle?.Value ?? "section";
            foreach (var lesson in section.CourseLessons)
            {
                if (lesson.IsDesktopEncryptedLesson)
                    continue;

                var current = lesson.VideoPath?.Value;
                if (string.IsNullOrWhiteSpace(current))
                    continue;
                if (current.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
                    continue;

                // Already structured under videos/courses/{course}/... (not info-Videos, not flat lessons/{id})
                var normalized = current.Replace('\\', '/');
                if (normalized.Contains("/videos/courses/", StringComparison.OrdinalIgnoreCase)
                    && !normalized.Contains("/info-Videos/", StringComparison.OrdinalIgnoreCase)
                    && !normalized.Contains("/lessons/", StringComparison.OrdinalIgnoreCase)
                    && Path.GetFileName(normalized).Contains('.'))
                {
                    // Heuristic: path depth videos/courses/course/section/file
                    var parts = normalized.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
                    var idx = Array.FindIndex(parts, p => p.Equals("courses", StringComparison.OrdinalIgnoreCase));
                    if (idx >= 0 && parts.Length >= idx + 4)
                        continue;
                }

                try
                {
                    var relocated = await courseVideoStorageService.ResolveLessonPathAsync(
                        current,
                        courseTitle,
                        sectionTitle,
                        lesson.LessonTitle?.Value ?? lesson.VideoTitle?.Value ?? $"lesson-{lesson.Id}",
                        lesson.Id > 0 ? lesson.Id : null,
                        cancellationToken);
                    if (!string.Equals(relocated, current, StringComparison.OrdinalIgnoreCase))
                        lesson.SetLessonVideo(lesson.VideoTitle?.Value ?? lesson.LessonTitle?.Value, relocated, lesson.DurationSeconds);
                }
                catch
                {
                    // Keep original path if relocation fails (source missing, etc.).
                }
            }
        }
    }

    private async Task<long> UploadEncryptedLessonAsync(
        long courseId,
        long lessonId,
        long ownerUserId,
        IFormFile file,
        string? videoTitle,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
            extension = ".mp4";

        var webRoot = ResolveWebRoot();
        var tempFolder = Path.Combine(Path.GetTempPath(), "arkalearn-lesson-upload", ownerUserId.ToString(), courseId.ToString());
        Directory.CreateDirectory(tempFolder);
        var tempFileName = $"lesson-{lessonId}{extension}";
        var tempPhysicalPath = Path.Combine(tempFolder, tempFileName);

        await using (var stream = File.Create(tempPhysicalPath))
            await file.CopyToAsync(stream, cancellationToken);

        var relativeUrl = $"/media/{ownerUserId}/course-upload-temp/{courseId}/{tempFileName}";
        var asset = MediaAsset.Create(
            ownerUserId,
            relativeUrl,
            file.FileName,
            string.IsNullOrWhiteSpace(file.ContentType) ? "video/mp4" : file.ContentType,
            file.Length,
            MediaType.Video,
            title: videoTitle);

        await mediaAssetRepository.InsertAsync(asset);
        await mediaAssetRepository.CommitAsync();

        var sourceForEncryption = tempPhysicalPath;
        string? watermarkedPhysical = null;
        try
        {
            // Watermark expects a web-root-relative path; copy into wwwroot temp if needed.
            var watermarkSourceRelative = relativeUrl;
            var wwwTempDir = Path.Combine(webRoot, "media", ownerUserId.ToString(), "course-upload-temp", courseId.ToString());
            Directory.CreateDirectory(wwwTempDir);
            var wwwTempPath = Path.Combine(wwwTempDir, tempFileName);
            if (!string.Equals(wwwTempPath, tempPhysicalPath, StringComparison.OrdinalIgnoreCase))
            {
                File.Copy(tempPhysicalPath, wwwTempPath, overwrite: true);
                watermarkedPhysical = wwwTempPath;
            }

            var watermarkedRelativePath = await watermarkProcessor.CreateWatermarkedCopyAsync(watermarkSourceRelative, cancellationToken);
            if (!string.IsNullOrWhiteSpace(watermarkedRelativePath))
            {
                var wmPhysical = Path.Combine(
                    webRoot,
                    watermarkedRelativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (File.Exists(wmPhysical))
                    sourceForEncryption = wmPhysical;
            }
        }
        catch
        {
            // Watermark is optional — fall back to the original upload.
        }

        var contentKeyId = Guid.NewGuid().ToString("N");
        asset.MarkEncryptionPending(contentKeyId);
        await mediaAssetRepository.CommitAsync();

        string? localEncryptedPath = null;
        try
        {
            var encryptDir = Path.Combine(Path.GetTempPath(), "arkalearn-encrypt", ownerUserId.ToString());
            Directory.CreateDirectory(encryptDir);
            var encryptedName = $"lesson_{courseId}_{lessonId}_{contentKeyId[..8]}.arka";
            localEncryptedPath = Path.Combine(encryptDir, encryptedName);

            var result = await encryptionService.EncryptToArkaContainerAsync(
                asset.Id,
                sourceForEncryption,
                encryptDir,
                encryptedName,
                asset.MimeType,
                contentKeyId,
                cancellationToken);

            var objectKey = $"drm/{ownerUserId}/{encryptedName}";
            await using (var fs = File.OpenRead(localEncryptedPath))
            {
                var stored = await fileStorage.PutAsync(
                    objectKey,
                    fs,
                    "application/octet-stream",
                    FileAccessTier.Drm,
                    cancellationToken);
                objectKey = stored.ObjectKey;
            }

            asset.CompleteEncryption(
                objectKey,
                result.ContentKeyId,
                result.IvBase64,
                result.ChecksumSha256,
                result.Algorithm);

            await mediaAssetRepository.CommitAsync();

            TryDelete(tempPhysicalPath);
            TryDelete(localEncryptedPath);
            if (watermarkedPhysical is not null) TryDelete(watermarkedPhysical);
            if (!string.Equals(sourceForEncryption, tempPhysicalPath, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(sourceForEncryption, watermarkedPhysical, StringComparison.OrdinalIgnoreCase))
                TryDelete(sourceForEncryption);

            return asset.Id;
        }
        catch
        {
            asset.MarkEncryptionFailed();
            await mediaAssetRepository.CommitAsync();
            throw;
        }
    }

    private async Task<long> ResolveOwnerUserIdAsync(long? teacherId, CancellationToken cancellationToken)
    {
        if (teacherId is not > 0)
            return 0;

        var userId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(teacherId.Value);
        return userId ?? 0;
    }

    private static int ParseDuration(HttpRequest request, string key)
    {
        var raw = request.Form[$"lessonVideoDuration_{key}"].FirstOrDefault();
        return int.TryParse(raw, out var seconds) ? Math.Max(0, seconds) : 0;
    }

    private static void TryDelete(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        try { File.Delete(path); } catch { /* best effort */ }
    }
}
