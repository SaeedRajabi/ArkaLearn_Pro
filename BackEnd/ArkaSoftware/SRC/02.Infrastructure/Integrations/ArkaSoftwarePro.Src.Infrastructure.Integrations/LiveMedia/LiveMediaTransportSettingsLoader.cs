using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using LiveMediaTransportSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities.LiveMediaTransportSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia;

/// <summary>نمای تنظیمات رسانه برای مصرف داخلی سرور؛ رمزهای این شیء پس از رمزگشایی در حافظه هستند.</summary>
/// <remarks>این شیء را مستقیماً به مرورگر یا لاگ نفرستید؛ کنترلر فقط فیلدهای لازم هر پاسخ را انتخاب می‌کند.</remarks>
public sealed class LiveMediaTransportSettingsSnapshot
{
    public string TransportMode { get; init; } = LiveMediaTransportSettingsEntity.ModeMesh;
    public string? LiveKitUrl { get; init; }
    public string? LiveKitApiKey { get; init; }
    public string? LiveKitApiSecret { get; init; }

    public string? TurnUrl { get; init; }
    public string? TurnUsername { get; init; }
    public string? TurnPassword { get; init; }
    public string? StunUrls { get; init; }

    public bool IsLiveKit =>
        string.Equals(TransportMode, LiveMediaTransportSettingsEntity.ModeLiveKit, StringComparison.OrdinalIgnoreCase);

    /// <summary>کامل بودن فیلدهای LiveKit در حالت SFU؛ این مقدار تست اتصال، اعتبار کلید یا سلامت سرور نیست.</summary>
    public bool IsLiveKitReady =>
        IsLiveKit &&
        !string.IsNullOrWhiteSpace(LiveKitUrl) &&
        !string.IsNullOrWhiteSpace(LiveKitApiKey) &&
        !string.IsNullOrWhiteSpace(LiveKitApiSecret);

    /// <summary>وجود آدرس، نام کاربری و رمز TURN را بررسی می‌کند؛ دسترس‌پذیری شبکه را آزمایش نمی‌کند.</summary>
    /// <remarks>TURN بدون اعتبارنامه در این مسیر آماده محسوب نمی‌شود و کنترلر اطلاعات آن را به کلاینت نمی‌دهد.</remarks>
    public bool IsTurnReady =>
        !string.IsNullOrWhiteSpace(TurnUrl) &&
        !string.IsNullOrWhiteSpace(TurnUsername) &&
        !string.IsNullOrWhiteSpace(TurnPassword);
}

/// <summary>تنظیمات ذخیره‌شده را می‌خواند و رمزهای لازم برای صدور توکن و تنظیم ICE را رمزگشایی می‌کند.</summary>
public sealed class LiveMediaTransportSettingsLoader(
    ILiveMediaTransportSettingsCommandRepository repository,
    ISecretProtector secretProtector)
{
    /// <summary>رکورد جاری را به تنظیمات اجرایی تبدیل می‌کند؛ نبود رکورد یا خطای خواندن مخزن به پیش‌فرض Mesh منتهی می‌شود.</summary>
    /// <param name="cancellationToken">توکن لغو عملیات خواندن مخزن.</param>
    /// <returns>تنظیمات سرور یا نمای پیش‌فرض بدون TURN و LiveKit آماده.</returns>
    /// <remarks>بلوک catch فعلی خطای مخزن، حتی لغو آن، را پنهان می‌کند؛ رمزگشایی خارج از این بلوک است.</remarks>
    public async Task<LiveMediaTransportSettingsSnapshot> LoadAsync(
        CancellationToken cancellationToken = default)
    {
        LiveMediaTransportSettingsEntity? row = null;
        try
        {
            row = await repository.GetCurrentAsync(cancellationToken);
        }
        catch
        {
            row = null;
        }

        if (row is null)
        {
            return new LiveMediaTransportSettingsSnapshot();
        }

        return new LiveMediaTransportSettingsSnapshot
        {
            TransportMode = LiveMediaTransportSettingsEntity.NormalizeMode(row.TransportMode),
            LiveKitUrl = row.LiveKitUrl,
            LiveKitApiKey = row.LiveKitApiKey,
            LiveKitApiSecret = secretProtector.Unprotect(row.LiveKitApiSecretEncrypted),
            TurnUrl = row.TurnUrl,
            TurnUsername = row.TurnUsername,
            TurnPassword = secretProtector.Unprotect(row.TurnPasswordEncrypted),
            StunUrls = row.StunUrls,
        };
    }
}
