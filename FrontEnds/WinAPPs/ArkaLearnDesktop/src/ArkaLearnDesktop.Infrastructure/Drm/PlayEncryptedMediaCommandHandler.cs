using System.IO;
using System.Net.Http;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Application.Drm.Commands;
using ArkaLearnDesktop.Domain.Drm;
using MediatR;

namespace ArkaLearnDesktop.Infrastructure.Drm;

public sealed class PlayEncryptedMediaCommandHandler(
    IDesktopApiClient apiClient,
    IOfflineLicenseService offlineLicense,
    ISecurePlaybackService playbackService,
    IEncryptedMediaCacheStore cacheStore,
    IDesktopLocalSettings localSettings)
    : IRequestHandler<PlayEncryptedMediaCommand, PlayEncryptedMediaResult>
{
    public async Task<PlayEncryptedMediaResult> Handle(PlayEncryptedMediaCommand request, CancellationToken cancellationToken)
    {
        if (request.MediaAssetId <= 0)
            return new PlayEncryptedMediaResult(false, "رسانه نامعتبر است.", null);

        var courseId = request.CourseId ?? 0;
        string? grantToken = null;

        if (courseId > 0)
        {
            await localSettings.EnsureInitializedAsync(cancellationToken);
            var deviceId = localSettings.DeviceId;
            grantToken = await offlineLicense.GetGrantTokenAsync(courseId, deviceId, cancellationToken);
            if (string.IsNullOrWhiteSpace(grantToken))
            {
                var grant = await apiClient.RequestOfflineGrantAsync(courseId, deviceId, cancellationToken);
                if (!grant.Success || string.IsNullOrWhiteSpace(grant.GrantToken))
                    return new PlayEncryptedMediaResult(false, grant.ErrorMessage ?? "دریافت مجوز آفلاین ناموفق بود.", null);

                grantToken = grant.GrantToken;
                await offlineLicense.SaveGrantAsync(
                    courseId,
                    grantToken,
                    grant.ExpiresAtUtc ?? DateTime.UtcNow.AddHours(72),
                    deviceId,
                    cancellationToken);
            }
        }
        else if (request.OwnerUserIdForToken is > 0)
        {
            grantToken = request.OwnerUserIdForToken.Value.ToString();
        }

        if (string.IsNullOrWhiteSpace(grantToken))
            return new PlayEncryptedMediaResult(false, "مجوز پخش یافت نشد.", null);

        var package = await apiClient.GetPlaybackPackageAsync(
            request.MediaAssetId,
            grantToken,
            courseId > 0 ? courseId : null,
            cancellationToken);

        if (package is null)
            return new PlayEncryptedMediaResult(false, "بسته پخش از سرور دریافت نشد.", null);

        if (string.IsNullOrWhiteSpace(package.WrappedContentKeyBase64))
            return new PlayEncryptedMediaResult(false, "کلید رمزگشایی ویدیو از سرور دریافت نشد.", null);

        try
        {
            // Reuse an already-decrypted RAM session when switching back to a recent lesson.
            if (playbackService.TryGetCachedPlayback(request.MediaAssetId, out var cachedUri))
                return new PlayEncryptedMediaResult(true, null, cachedUri);

            Stream encryptedStream;
            long? encryptedLength;
            Stream? cacheWriteStream = null;
            IAsyncDisposable? streamOwnership = null;

            var cached = await cacheStore.GetByMediaIdAsync(request.MediaAssetId, cancellationToken);
            if (cached is not null && File.Exists(cached.LocalEncryptedPath))
            {
                encryptedStream = new FileStream(
                    cached.LocalEncryptedPath,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.Read,
                    bufferSize: 256 * 1024,
                    options: FileOptions.Asynchronous | FileOptions.SequentialScan);
                encryptedLength = new FileInfo(cached.LocalEncryptedPath).Length;
            }
            else
            {
                var url = string.IsNullOrWhiteSpace(request.EncryptedFileUrl)
                    ? package.EncryptedFileUrl
                    : request.EncryptedFileUrl;
                var download = await apiClient.OpenEncryptedDownloadAsync(url, cancellationToken);
                streamOwnership = download;
                encryptedStream = download.Stream;
                encryptedLength = download.ContentLength;

                var cacheDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "ArkaLearnDesktop",
                    "encrypted-cache");
                Directory.CreateDirectory(cacheDir);

                var cacheExtension = GetCacheExtension(package.EncryptionAlgorithm);
                var localPath = Path.Combine(cacheDir, $"{request.MediaAssetId}{cacheExtension}");
                var tempPath = localPath + ".partial";
                var rawCacheStream = new FileStream(
                    tempPath,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None,
                    bufferSize: 256 * 1024,
                    options: FileOptions.Asynchronous | FileOptions.SequentialScan);

                cacheWriteStream = new CacheFinalizeStream(
                    rawCacheStream,
                    tempPath,
                    localPath,
                    async () =>
                    {
                        var size = File.Exists(localPath) ? new FileInfo(localPath).Length : encryptedLength ?? 0;
                        await cacheStore.UpsertAsync(new LocalEncryptedMediaCache
                        {
                            MediaAssetId = request.MediaAssetId,
                            CourseId = courseId > 0 ? courseId : null,
                            Title = package.Title,
                            LocalEncryptedPath = localPath,
                            IvBase64 = package.IvBase64,
                            ContentChecksumSha256 = package.ContentChecksumSha256,
                            MimeType = package.MimeType,
                            FileSizeBytes = size,
                            DownloadedAtUtc = DateTime.UtcNow,
                        }, CancellationToken.None);
                    });
            }

            var uri = await playbackService.StartProgressiveRamPlaybackAsync(
                encryptedStream,
                encryptedLength,
                package.EncryptionAlgorithm,
                package.IvBase64,
                package.WrappedContentKeyBase64,
                grantToken,
                package.MimeType,
                cacheWriteStream,
                streamOwnership,
                request.MediaAssetId,
                cancellationToken);

            return new PlayEncryptedMediaResult(true, null, uri);
        }
        catch (OperationCanceledException)
        {
            return new PlayEncryptedMediaResult(false, "دریافت رسانه لغو شد.", null);
        }
        catch (Exception ex)
        {
            return new PlayEncryptedMediaResult(false, ToFriendlyError(ex), null);
        }
    }

    private static string GetCacheExtension(string? encryptionAlgorithm) =>
        string.Equals(encryptionAlgorithm, ArkaContainerReader.Algorithm, StringComparison.OrdinalIgnoreCase)
            ? ".arka"
            : ".enc";

    private static string ToFriendlyError(Exception ex)
    {
        if (ex is InvalidDataException)
            return "فایل رسانه آسیب دیده یا ناقص است. لطفاً دوباره تلاش کنید.";
        if (ex is HttpRequestException)
            return "امکان دریافت رسانه از سرور فراهم نشد. اتصال اینترنت را بررسی کنید.";
        if (ex is IOException)
            return "خطا در خواندن یا ذخیره فایل رسانه. لطفاً دوباره تلاش کنید.";
        return "آماده‌سازی پخش ممکن نشد. لطفاً دوباره تلاش کنید.";
    }
}
