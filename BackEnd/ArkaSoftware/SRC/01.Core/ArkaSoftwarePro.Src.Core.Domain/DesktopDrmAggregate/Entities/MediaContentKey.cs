using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>Server-side vault entry for per-asset AES content keys (protected with master key).</summary>
public class MediaContentKey : AggregateRoot
{
    public string KeyId { get; private set; } = string.Empty;
    public long MediaAssetId { get; private set; }
    public string ProtectedKeyMaterial { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    private MediaContentKey() { }

    public static MediaContentKey Create(string keyId, long mediaAssetId, string protectedKeyMaterial)
    {
        if (string.IsNullOrWhiteSpace(keyId))
            throw new ArgumentException("Key id is required.", nameof(keyId));
        if (mediaAssetId <= 0)
            throw new ArgumentException("Media asset id is required.", nameof(mediaAssetId));
        if (string.IsNullOrWhiteSpace(protectedKeyMaterial))
            throw new ArgumentException("Protected key material is required.", nameof(protectedKeyMaterial));

        return new MediaContentKey
        {
            KeyId = keyId.Trim(),
            MediaAssetId = mediaAssetId,
            ProtectedKeyMaterial = protectedKeyMaterial.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
        };
    }
}
