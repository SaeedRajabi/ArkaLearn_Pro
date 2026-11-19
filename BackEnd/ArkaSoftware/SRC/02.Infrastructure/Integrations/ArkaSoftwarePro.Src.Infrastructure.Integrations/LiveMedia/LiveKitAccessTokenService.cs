using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia;

/// <summary>Creates LiveKit access tokens (JWT HS256) without an external LiveKit NuGet package.</summary>
public sealed class LiveKitAccessTokenService
{
    /// <summary>توکن امضاشده برای ورود یک هویت به یک اتاق LiveKit تولید می‌کند؛ هیچ اتصال شبکه‌ای برقرار نمی‌کند.</summary>
    /// <param name="apiKey">شناسه کلید سرور LiveKit که در claim صادرکننده قرار می‌گیرد.</param>
    /// <param name="apiSecret">کلید امضای HS256؛ فقط در سرور مصرف می‌شود.</param>
    /// <param name="identity">شناسه شرکت‌کننده در اتاق؛ فراخواننده فعلی شناسه اتصال SignalR را می‌فرستد.</param>
    /// <param name="displayName">نام نمایشی؛ در صورت خالی بودن از هویت استفاده می‌شود.</param>
    /// <param name="roomName">نام اتاق مجاز در video.room.</param>
    /// <param name="canPublish">مجوز انتشار رسانه در خود LiveKit، مستقل از کنترل‌های رابط کاربری.</param>
    /// <param name="ttl">مدت اعتبار از زمان UTC فعلی.</param>
    /// <returns>JWT دارای مجوز ورود، دریافت رسانه، ارسال داده و مجوز انتشار درخواستی.</returns>
    /// <remarks>احراز عضویت اتاق و تعیین سطح دسترسی وظیفه فراخواننده است؛ این سرویس فقط توکن می‌سازد.</remarks>
    public string CreateToken(
        string apiKey,
        string apiSecret,
        string identity,
        string? displayName,
        string roomName,
        bool canPublish,
        TimeSpan ttl)
    {
        var now = DateTimeOffset.UtcNow;
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var header = new JwtHeader(credentials);

        var videoGrants = new Dictionary<string, object>
        {
            ["roomJoin"] = true,
            ["room"] = roomName,
            ["canPublish"] = canPublish,
            ["canSubscribe"] = true,
            ["canPublishData"] = true,
        };

        var payload = new JwtPayload
        {
            { "iss", apiKey },
            { "sub", identity },
            { "name", string.IsNullOrWhiteSpace(displayName) ? identity : displayName },
            { "nbf", now.ToUnixTimeSeconds() },
            { "exp", now.Add(ttl).ToUnixTimeSeconds() },
            { "video", videoGrants },
        };

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(header, payload));
    }
}
