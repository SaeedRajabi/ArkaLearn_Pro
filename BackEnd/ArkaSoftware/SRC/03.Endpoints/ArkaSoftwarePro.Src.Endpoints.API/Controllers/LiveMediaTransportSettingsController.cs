using ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Commands.UpsertLiveMediaTransportSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Queries.GetLiveMediaTransportSettings;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

/// <summary>مرز HTTP برای تنظیمات مدیریتی، پیکربندی مرورگر و صدور توکن رسانه زنده.</summary>
/// <remarks>احراز هویت با Cookie یا JWT انجام می‌شود؛ مجوز مدیریتی ذخیره در CommandHandler بررسی می‌شود.</remarks>
[Route("api/Service/[controller]")]
public class LiveMediaTransportSettingsController(
    LiveMediaTransportSettingsLoader loader,
    LiveKitAccessTokenService tokenService) : BaseController
{
    /// <summary>تنظیمات فرم را از QueryHandler می‌گیرد؛ رمزها با پرچم وجود رمز جایگزین می‌شوند.</summary>
    [HttpGet("Get")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Get([FromQuery] GetLiveMediaTransportSettingsQuery query)
        => await Query<GetLiveMediaTransportSettingsQuery, LiveMediaTransportSettingsQri>(query);

    /// <summary>درخواست ذخیره را به مسیر اعتبارسنجی مجوز مدیر، رمزگذاری و ثبت در مخزن می‌فرستد.</summary>
    [HttpPost("Upsert")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Upsert([FromBody] UpsertLiveMediaTransportSettingsCommand command)
        => await Create<UpsertLiveMediaTransportSettingsCommand, string>(command);

    /// <summary>Room config: mode + LiveKit URL (no secrets) + admin-managed TURN/STUN for the mesh.
    /// TURN static credentials must reach the browser for ICE relay — they are not server-only secrets.</summary>
    [HttpGet("GetRuntimeConfig")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetRuntimeConfig(CancellationToken cancellationToken)
    {
        var snap = await loader.LoadAsync(cancellationToken);
        return Ok(new
        {
            transportMode = snap.TransportMode,
            liveKitUrl = snap.IsLiveKit ? snap.LiveKitUrl : null,
            isLiveKitReady = snap.IsLiveKitReady,
            turnUrls = snap.IsTurnReady ? snap.TurnUrl : null,
            turnUsername = snap.IsTurnReady ? snap.TurnUsername : null,
            turnPassword = snap.IsTurnReady ? snap.TurnPassword : null,
            stunUrls = string.IsNullOrWhiteSpace(snap.StunUrls) ? null : snap.StunUrls,
        });
    }

    /// <summary>با تنظیمات جاری، توکن شش‌ساعته برای اتاق و هویت درخواست‌شده صادر می‌کند.</summary>
    /// <remarks>
    /// پیاده‌سازی فعلی پس از احراز هویت و بررسی فیلدها، عضویت اتاق یا نقش منتشرکننده را از Ticket استخراج نمی‌کند.
    /// CanPublish ارسال‌شده توسط کلاینت مبنای grant است؛ محدودیت رابط کاربری جایگزین مجوز سرور نیست.
    /// </remarks>
    [HttpPost("CreateLiveKitToken")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateLiveKitToken(
        [FromBody] CreateLiveKitTokenRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RoomName) ||
            string.IsNullOrWhiteSpace(request.Identity))
        {
            return BadRequest(new { message = "RoomName and Identity are required." });
        }

        var snap = await loader.LoadAsync(cancellationToken);
        if (!snap.IsLiveKitReady)
        {
            return BadRequest(new { message = "LiveKit transport is not configured or not enabled." });
        }

        var token = tokenService.CreateToken(
            snap.LiveKitApiKey!,
            snap.LiveKitApiSecret!,
            request.Identity.Trim(),
            request.DisplayName?.Trim(),
            request.RoomName.Trim(),
            canPublish: request.CanPublish != false,
            ttl: TimeSpan.FromHours(6));

        return Ok(new
        {
            token,
            url = snap.LiveKitUrl,
            roomName = request.RoomName.Trim(),
            identity = request.Identity.Trim(),
        });
    }
}

/// <summary>داده ورودی صدور توکن؛ مقادیر این مدل توسط کلاینت ارسال می‌شوند.</summary>
public sealed class CreateLiveKitTokenRequest
{
    /// <summary>نام اتاق مقصد در LiveKit.</summary>
    public string RoomName { get; set; } = string.Empty;
    /// <summary>هویت شرکت‌کننده در اتاق رسانه.</summary>
    public string Identity { get; set; } = string.Empty;
    /// <summary>نام نمایشی اختیاری شرکت‌کننده.</summary>
    public string? DisplayName { get; set; }
    /// <summary>در مسیر فعلی فقط false انتشار را منع می‌کند؛ null نیز به true تبدیل می‌شود.</summary>
    public bool? CanPublish { get; set; }
}
