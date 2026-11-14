using System.Text.RegularExpressions;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

/// <summary>
/// Builds clean FTP object keys for course videos and relocates media uploads into them.
/// Intro:  videos/courses/info-Videos/{courseTitle}.mp4
/// Lesson: videos/courses/{courseTitle}/{sectionTitle}/{lessonTitle}.mp4
/// </summary>
public sealed class CourseVideoStorageService(
    IFileStorage fileStorage,
    FileStorage.FileStoragePathSaver fileStoragePathSaver,
    IMediaAssetCommandRepository mediaAssetCommandRepository)
{
    public static string SanitizeSegment(string? raw, string fallback = "item")
    {
        var s = (raw ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(s))
            return fallback;

        foreach (var c in Path.GetInvalidFileNameChars())
            s = s.Replace(c, '_');
        s = s.Replace('/', '_').Replace('\\', '_').Replace(':', '_');
        s = Regex.Replace(s, @"\s+", " ").Trim(' ', '.', '_');
        if (string.IsNullOrWhiteSpace(s))
            return fallback;
        if (s.Length > 100)
            s = s[..100].Trim(' ', '.', '_');
        return string.IsNullOrWhiteSpace(s) ? fallback : s;
    }

    public static string NormalizeExtension(string? pathOrFileName, string fallback = ".mp4")
    {
        var ext = Path.GetExtension(pathOrFileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(ext) || ext.Length > 8)
            return fallback;
        return ext.ToLowerInvariant();
    }

    public static string BuildIntroObjectKey(string courseTitle, string extension)
    {
        var ext = NormalizeExtension(extension);
        var name = SanitizeSegment(courseTitle, "course-intro");
        return $"videos/courses/info-Videos/{name}{ext}";
    }

    public static string BuildLessonObjectKey(
        string courseTitle,
        string sectionTitle,
        string lessonTitle,
        string extension,
        long? uniquenessSuffix = null)
    {
        var ext = NormalizeExtension(extension);
        var course = SanitizeSegment(courseTitle, "course");
        var section = SanitizeSegment(sectionTitle, "section");
        var lesson = SanitizeSegment(lessonTitle, "lesson");
        if (uniquenessSuffix is > 0)
            lesson = $"{lesson}-{uniquenessSuffix.Value}";
        return $"videos/courses/{course}/{section}/{lesson}{ext}";
    }

    public async Task<string> SaveIntroFromUploadAsync(
        IFormFile file,
        string courseTitle,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        var ext = NormalizeExtension(file.FileName);
        var fileName = $"{SanitizeSegment(courseTitle, "course-intro")}{ext}";
        return await fileStoragePathSaver.SavePublicAsync(
            file,
            "videos/courses/info-Videos",
            fileName,
            cancellationToken);
    }

    public async Task<string> ResolveIntroPathAsync(
        string? videoInfoUrl,
        string courseTitle,
        CancellationToken cancellationToken = default)
    {
        var raw = (videoInfoUrl ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("Intro video URL is empty.");

        if (raw.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Course intro video must be a public media file. Desktop-encrypted (DRM) videos cannot be used as the course introduction.");
        }

        var sourcePath = await ResolveReadableSourcePathAsync(raw, cancellationToken);
        if (sourcePath.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Course intro video must be a public media file. Desktop-encrypted (DRM) videos cannot be used as the course introduction.");
        }
        var ext = NormalizeExtension(sourcePath);
        var targetKey = BuildIntroObjectKey(courseTitle, ext);

        if (IsAlreadyAtObjectKey(sourcePath, targetKey))
            return ToPublicWebPath(sourcePath);

        try
        {
            return await CopyPublicObjectAsync(sourcePath, targetKey, cancellationToken);
        }
        catch (Exception ex)
        {
            // Keep the already-uploaded public media URL so course save/preview still work
            // when relocate-to-info-Videos fails (storage lag, path mapping, etc.).
            var fallback = ToPublicWebPath(sourcePath);
            if (string.IsNullOrWhiteSpace(fallback) || fallback.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"Could not prepare course intro video from '{raw}'. {ex.Message}", ex);
            return fallback;
        }
    }

    public async Task<string> ResolveLessonPathAsync(
        string? videoUrl,
        string courseTitle,
        string sectionTitle,
        string lessonTitle,
        long? lessonId = null,
        CancellationToken cancellationToken = default)
    {
        var raw = (videoUrl ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("Lesson video URL is empty.");

        if (raw.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
            return raw;

        // Already under the structured course tree — keep.
        if (LooksLikeStructuredLessonPath(raw))
            return ToPublicWebPath(NormalizePublicUrl(raw));

        var sourcePath = await ResolveReadableSourcePathAsync(raw, cancellationToken);
        var ext = NormalizeExtension(sourcePath);
        var targetKey = BuildLessonObjectKey(courseTitle, sectionTitle, lessonTitle, ext, lessonId);
        return await CopyPublicObjectAsync(sourcePath, targetKey, cancellationToken);
    }

    public async Task<string> SavePlainLessonFromUploadAsync(
        IFormFile file,
        string courseTitle,
        string sectionTitle,
        string lessonTitle,
        long? lessonId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        var ext = NormalizeExtension(file.FileName);
        var objectKey = BuildLessonObjectKey(courseTitle, sectionTitle, lessonTitle, ext, lessonId);
        await using var stream = file.OpenReadStream();
        var stored = await fileStorage.PutAsync(
            objectKey,
            stream,
            string.IsNullOrWhiteSpace(file.ContentType) ? "video/mp4" : file.ContentType,
            FileAccessTier.Public,
            cancellationToken);
        return FileStorage.FileStoragePathSaver.ToDbStoredPath(stored);
    }

    private async Task<string> ResolveReadableSourcePathAsync(string raw, CancellationToken cancellationToken)
    {
        var normalized = NormalizePublicUrl(raw);

        // Bare numeric id or /media/{id} without filename → MediaAsset.FileUrl
        if (TryParseMediaAssetId(normalized, out var mediaId))
        {
            var asset = await mediaAssetCommandRepository.GetAsync(mediaId);
            if (asset is null || asset.Id <= 0 || string.IsNullOrWhiteSpace(asset.FileUrl))
                throw new InvalidOperationException($"Media asset {mediaId} was not found or has no file URL.");
            if (asset.FileUrl.StartsWith("drm://", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Course intro video must be a public media file. Desktop-encrypted (DRM) videos cannot be used as the course introduction.");
            }
            return NormalizePublicUrl(asset.FileUrl);
        }

        if (!normalized.Contains('.') && !normalized.Contains('/'))
            throw new InvalidOperationException("Invalid video path; expected a real media file URL.");

        return normalized;
    }

    private async Task<string> CopyPublicObjectAsync(
        string sourceWebPath,
        string targetObjectKey,
        CancellationToken cancellationToken)
    {
        var sourceKey = fileStorage.ToObjectKey(sourceWebPath, FileAccessTier.Public);
        await using var stream = await fileStorage.OpenReadAsync(sourceKey, cancellationToken);
        if (stream is null)
            throw new InvalidOperationException($"Could not read source video '{sourceWebPath}'.");

        // Buffer — FTP upload often needs a seekable stream.
        await using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, cancellationToken);
        buffer.Position = 0;

        var contentType = GuessContentType(targetObjectKey);
        var stored = await fileStorage.PutAsync(
            targetObjectKey,
            buffer,
            contentType,
            FileAccessTier.Public,
            cancellationToken);
        return FileStorage.FileStoragePathSaver.ToDbStoredPath(stored);
    }

    private static bool TryParseMediaAssetId(string normalizedPath, out long mediaId)
    {
        mediaId = 0;
        var trimmed = normalizedPath.Trim('/');
        if (long.TryParse(trimmed, out mediaId) && mediaId > 0)
            return true;

        // /media/8  or  media/8
        var mediaMatch = Regex.Match(trimmed, @"^media/(\d+)$", RegexOptions.IgnoreCase);
        if (mediaMatch.Success && long.TryParse(mediaMatch.Groups[1].Value, out mediaId) && mediaId > 0)
            return true;

        // /videos/8  (legacy bad rewrite)
        var videosMatch = Regex.Match(trimmed, @"^(?:public/)?videos/(\d+)$", RegexOptions.IgnoreCase);
        if (videosMatch.Success && long.TryParse(videosMatch.Groups[1].Value, out mediaId) && mediaId > 0)
            return true;

        return false;
    }

    private static bool LooksLikeStructuredLessonPath(string path)
    {
        var n = NormalizePublicUrl(path).TrimStart('/');
        if (n.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            n = n["public/".Length..];
        // videos/courses/{course}/{section}/{file}
        var parts = n.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length >= 5
               && parts[0].Equals("videos", StringComparison.OrdinalIgnoreCase)
               && parts[1].Equals("courses", StringComparison.OrdinalIgnoreCase)
               && !parts[2].Equals("info-Videos", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAlreadyAtObjectKey(string sourceWebPath, string targetObjectKey)
    {
        var n = NormalizePublicUrl(sourceWebPath).TrimStart('/');
        if (n.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            n = n["public/".Length..];
        var target = targetObjectKey.TrimStart('/');
        return n.Equals(target, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizePublicUrl(string url)
    {
        var trimmed = url.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            return absolute.AbsolutePath;
        return trimmed.StartsWith('/') ? trimmed : "/" + trimmed;
    }

    private static string ToPublicWebPath(string path)
    {
        var n = NormalizePublicUrl(path);
        if (n.StartsWith("/public/", StringComparison.OrdinalIgnoreCase) ||
            n.StartsWith("/media/", StringComparison.OrdinalIgnoreCase) ||
            n.StartsWith("/videos/", StringComparison.OrdinalIgnoreCase) ||
            n.StartsWith("/drm/", StringComparison.OrdinalIgnoreCase))
            return n;
        return n.StartsWith('/') ? n : "/" + n;
    }

    private static string GuessContentType(string objectKey)
    {
        var ext = Path.GetExtension(objectKey).ToLowerInvariant();
        return ext switch
        {
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".ogg" => "video/ogg",
            _ => "video/mp4"
        };
    }
}
