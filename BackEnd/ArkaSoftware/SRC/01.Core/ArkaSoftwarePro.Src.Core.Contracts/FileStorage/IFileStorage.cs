namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public enum FileAccessTier
{
    Public = 0,
    Private = 1,
    Drm = 2,
}

public sealed record StoredObjectResult(
    string ObjectKey,
    string PublicOrAbsoluteUrl,
    long SizeBytes,
    string ContentType);

public interface IFileStorage
{
    Task<StoredObjectResult> PutAsync(
        string objectKey,
        Stream content,
        string contentType,
        FileAccessTier tier,
        CancellationToken cancellationToken = default);

    Task<Stream?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default);

    Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default);

    string GetPublicUrl(string objectKey);

    string CreateSignedReadUrl(string objectKey, TimeSpan? ttl = null);

    /// <summary>Maps legacy wwwroot-relative web paths (/images/...) to object keys.</summary>
    string ToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null);
}
