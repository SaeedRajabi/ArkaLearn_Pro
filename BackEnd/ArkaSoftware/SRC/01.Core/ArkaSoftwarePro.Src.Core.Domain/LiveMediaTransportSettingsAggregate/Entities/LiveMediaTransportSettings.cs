using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities;

/// <summary>Singleton platform setting: Mesh WebRTC vs LiveKit SFU for online rooms.</summary>
public class LiveMediaTransportSettings : AggregateRoot
{
    public const string ModeMesh = "Mesh";
    public const string ModeLiveKit = "LiveKit";

    public string TransportMode { get; private set; } = ModeMesh;
    public string? LiveKitUrl { get; private set; }
    public string? LiveKitApiKey { get; private set; }
    public string? LiveKitApiSecretEncrypted { get; private set; }

    /// <summary>Comma-separated TURN urls (e.g. turn:host:3478,turns:host:5349). Required for media across NATs.</summary>
    public string? TurnUrl { get; private set; }
    public string? TurnUsername { get; private set; }
    public string? TurnPasswordEncrypted { get; private set; }
    /// <summary>Optional comma-separated STUN urls; public defaults apply when empty.</summary>
    public string? StunUrls { get; private set; }

    /// <summary>سازنده بدون پارامتر برای بازسازی موجودیت توسط نگاشت داده.</summary>
    private LiveMediaTransportSettings()
    {
    }

    /// <summary>تنظیمات اولیه را با همان قواعد نرمال‌سازی Update ایجاد می‌کند؛ رمزها باید از قبل رمزگذاری شده باشند.</summary>
    public LiveMediaTransportSettings(
        string transportMode,
        string? liveKitUrl,
        string? liveKitApiKey,
        string? liveKitApiSecretEncrypted,
        string? turnUrl = null,
        string? turnUsername = null,
        string? turnPasswordEncrypted = null,
        string? stunUrls = null)
    {
        Update(transportMode, liveKitUrl, liveKitApiKey, liveKitApiSecretEncrypted, turnUrl, turnUsername, turnPasswordEncrypted, stunUrls);
    }

    /// <summary>مقادیر را جایگزین و رشته‌های خالی را null می‌کند؛ بررسی دسترسی مدیر و رمزگذاری در لایه کاربرد انجام می‌شود.</summary>
    /// <remarks>این متد URL، نسخه LiveKit، صحت اعتبارنامه یا دسترس‌پذیری سرور را آزمایش نمی‌کند.</remarks>
    public void Update(
        string transportMode,
        string? liveKitUrl,
        string? liveKitApiKey,
        string? liveKitApiSecretEncrypted,
        string? turnUrl = null,
        string? turnUsername = null,
        string? turnPasswordEncrypted = null,
        string? stunUrls = null)
    {
        TransportMode = NormalizeMode(transportMode);
        LiveKitUrl = string.IsNullOrWhiteSpace(liveKitUrl) ? null : liveKitUrl.Trim();
        LiveKitApiKey = string.IsNullOrWhiteSpace(liveKitApiKey) ? null : liveKitApiKey.Trim();
        LiveKitApiSecretEncrypted = string.IsNullOrWhiteSpace(liveKitApiSecretEncrypted)
            ? null
            : liveKitApiSecretEncrypted;
        TurnUrl = string.IsNullOrWhiteSpace(turnUrl) ? null : turnUrl.Trim();
        TurnUsername = string.IsNullOrWhiteSpace(turnUsername) ? null : turnUsername.Trim();
        TurnPasswordEncrypted = string.IsNullOrWhiteSpace(turnPasswordEncrypted)
            ? null
            : turnPasswordEncrypted;
        StunUrls = string.IsNullOrWhiteSpace(stunUrls) ? null : stunUrls.Trim();
    }

    /// <summary>وجود فیلدهای TURN ذخیره‌شده را می‌سنجد؛ با سلامت واقعی relay یکسان نیست.</summary>
    public bool IsTurnReady =>
        !string.IsNullOrWhiteSpace(TurnUrl) &&
        !string.IsNullOrWhiteSpace(TurnUsername) &&
        !string.IsNullOrWhiteSpace(TurnPasswordEncrypted);

    /// <summary>LiveKit را بدون حساسیت به حروف تشخیص می‌دهد؛ هر مقدار دیگر، از جمله مقدار ناشناخته، Mesh می‌شود.</summary>
    public static string NormalizeMode(string? mode)
    {
        var value = (mode ?? string.Empty).Trim();
        return string.Equals(value, ModeLiveKit, StringComparison.OrdinalIgnoreCase)
            ? ModeLiveKit
            : ModeMesh;
    }

    /// <summary>فقط انتخاب حالت SFU را نشان می‌دهد، مستقل از کامل بودن فیلدهای اتصال.</summary>
    public bool IsLiveKit => string.Equals(TransportMode, ModeLiveKit, StringComparison.OrdinalIgnoreCase);
}
