using System.IO;
using System.Security.Cryptography;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Drm;

public sealed class SecureMaterialDownloadService(
    IDesktopApiClient apiClient,
    IOfflineLicenseService offlineLicense,
    IDesktopLocalSettings localSettings)
    : ISecureMaterialDownloadService
{
    public async Task DownloadAsync(
        long courseId,
        DesktopCourseCurriculumMaterialDto material,
        string destinationPath,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0)
            throw new ArgumentOutOfRangeException(nameof(courseId));
        if (material.MediaAssetId <= 0)
            throw new ArgumentException("Material media asset is invalid.", nameof(material));
        if (string.IsNullOrWhiteSpace(destinationPath))
            throw new ArgumentException("Destination path is required.", nameof(destinationPath));

        await localSettings.EnsureInitializedAsync(cancellationToken);
        var deviceId = localSettings.DeviceId;
        var grantToken = await offlineLicense.GetGrantTokenAsync(courseId, deviceId, cancellationToken);
        if (string.IsNullOrWhiteSpace(grantToken))
        {
            var grant = await apiClient.RequestOfflineGrantAsync(courseId, deviceId, cancellationToken);
            if (!grant.Success || string.IsNullOrWhiteSpace(grant.GrantToken))
                throw new InvalidOperationException(grant.ErrorMessage ?? "دریافت مجوز دانلود ناموفق بود.");

            grantToken = grant.GrantToken;
            await offlineLicense.SaveGrantAsync(
                courseId,
                grantToken,
                grant.ExpiresAtUtc ?? DateTime.UtcNow.AddHours(72),
                deviceId,
                cancellationToken);
        }

        var package = await apiClient.GetPlaybackPackageAsync(
            material.MediaAssetId,
            grantToken,
            courseId,
            cancellationToken);
        if (package is null)
            throw new InvalidOperationException("بسته دانلود امن از سرور دریافت نشد.");

        var encryptedPayload = await apiClient.DownloadEncryptedBytesAsync(
            package.EncryptedFileUrl,
            cancellationToken);
        byte[]? contentKey = null;
        byte[]? plainBytes = null;
        var tempPath = destinationPath + ".partial";

        try
        {
            var cipherText = ArkaContainerReader.IsArkaContainer(package.EncryptionAlgorithm, encryptedPayload)
                ? ArkaContainerReader.ExtractCiphertext(encryptedPayload, out _)
                : encryptedPayload;
            contentKey = AesCbcCryptography.UnwrapContentKey(package.WrappedContentKeyBase64, grantToken);
            var iv = Convert.FromBase64String(package.IvBase64);
            plainBytes = AesCbcCryptography.DecryptAesCbc(cipherText, contentKey, iv);

            var directory = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrWhiteSpace(directory))
                Directory.CreateDirectory(directory);

            await File.WriteAllBytesAsync(tempPath, plainBytes, cancellationToken);
            File.Move(tempPath, destinationPath, overwrite: true);
        }
        finally
        {
            if (File.Exists(tempPath))
                File.Delete(tempPath);
            if (contentKey is not null)
                CryptographicOperations.ZeroMemory(contentKey);
            if (plainBytes is not null)
                CryptographicOperations.ZeroMemory(plainBytes);
            CryptographicOperations.ZeroMemory(encryptedPayload);
        }
    }
}
