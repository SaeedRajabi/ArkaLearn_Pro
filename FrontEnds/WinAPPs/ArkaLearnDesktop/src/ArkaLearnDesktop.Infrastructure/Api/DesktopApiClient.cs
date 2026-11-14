using ArkaLearnDesktop.Application.Abstractions;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace ArkaLearnDesktop.Infrastructure.Api;

public sealed class DesktopApiClient : IDesktopApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = ApiJsonHelper.Options;

    private readonly HttpClient _http;
    private readonly IDesktopLocalSettings _settings;
    private readonly IAuthSessionStore _sessionStore;

    public DesktopApiClient(HttpClient http, IDesktopLocalSettings settings, IAuthSessionStore sessionStore)
    {
        _http = http;
        _settings = settings;
        _sessionStore = sessionStore;
    }

    public async Task<DesktopLoginApiResult> LoginAsync(
        string userNameOrEmail,
        string password,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await EnsureBaseAddressAsync(cancellationToken);

            using var response = await _http.PostAsJsonAsync(
                "Account/Login",
                new { userNameOrEmail, password },
                cancellationToken);

            var raw = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var message = TryReadErrorMessage(raw) ?? $"Login failed ({(int)response.StatusCode}).";
                return new DesktopLoginApiResult(false, message, null, null, null);
            }

            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "{}" : raw);
            var root = UnwrapApiPayload(doc.RootElement);
            var userData = ExtractUserData(root);
            if (userData is null || string.IsNullOrWhiteSpace(userData.Token))
                return new DesktopLoginApiResult(false, "پاسخ ورود نامعتبر است.", null, null, null);

            if (!long.TryParse(userData.Id, out var userId) || userId <= 0)
                return new DesktopLoginApiResult(false, "شناسه کاربر نامعتبر است.", null, null, null);

            var profile = new DesktopUserProfile(
                userId,
                userData.UserName ?? userNameOrEmail,
                userData.FullName ?? userData.Name ?? userData.UserName ?? userNameOrEmail,
                userData.Email ?? string.Empty,
                userData.Role ?? "user",
                userData.AvatarUrl);

            var expires = TryReadJwtExpiryUtc(userData.Token)
                          ?? DateTime.UtcNow.AddHours(12);
            return new DesktopLoginApiResult(true, null, profile, userData.Token, expires);
        }
        catch (TaskCanceledException)
        {
            // Most commonly: request timeout / slow network.
            return new DesktopLoginApiResult(
                false,
                "اتصال به سرور زمان زیادی طول کشید. لطفاً اینترنت را بررسی کنید و دوباره تلاش کنید.",
                null,
                null,
                null);
        }
        catch (HttpRequestException ex)
        {
            // Typical message: "No such host is known. (api.arkasoftware.ir:443)"
            var hostHint = "api.arkasoftware.ir";
            var isHostResolution = ex.Message.Contains(hostHint, StringComparison.OrdinalIgnoreCase) ||
                                   ex.InnerException?.Message?.Contains(hostHint, StringComparison.OrdinalIgnoreCase) == true;

            var message = isHostResolution
                ? "امکان اتصال به سرور فراهم نشد (DNS/دسترسی به `api.arkasoftware.ir` ممکن نیست). لطفاً اینترنت و تنظیمات شبکه (یا فیلترشکن/VPN در صورت نیاز) را بررسی کنید و دوباره امتحان کنید."
                : "خطای اتصال به سرور رخ داد. لطفاً اینترنت را بررسی کنید و دوباره تلاش کنید.";

            return new DesktopLoginApiResult(false, message, null, null, null);
        }
    }

    public async Task<bool> ValidateSessionAsync(CancellationToken cancellationToken = default)
    {
        var check = await EnsureSessionAsync(cancellationToken);
        return check.Status == DesktopSessionCheckStatus.Valid;
    }

    public async Task<DesktopSessionCheckResult> EnsureSessionAsync(CancellationToken cancellationToken = default)
    {
        var token = await _sessionStore.GetAccessTokenAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(token))
            return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Invalid, "No stored session.");

        var profile = await _sessionStore.GetCurrentUserAsync(cancellationToken);

        try
        {
            await EnsureBaseAddressAsync(cancellationToken);

            using (var verifyRequest = new HttpRequestMessage(HttpMethod.Get, "User/verify-session"))
            {
                verifyRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                using var verifyResponse = await _http.SendAsync(verifyRequest, cancellationToken);
                if (verifyResponse.IsSuccessStatusCode)
                    return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Valid);

                if (verifyResponse.StatusCode is not HttpStatusCode.Unauthorized and not HttpStatusCode.Forbidden)
                {
                    // Transient / unexpected — treat as offline so we do not wipe a good local session.
                    return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Offline, "Session verification unavailable.");
                }
            }

            // Access JWT expired or rejected — try renewing while backend UserSession is still alive.
            using var renewResponse = await _http.PostAsJsonAsync(
                "Account/RenewDesktopSession",
                new { accessToken = token },
                cancellationToken);

            if (!renewResponse.IsSuccessStatusCode)
            {
                // Create() maps auth failures to 400; only keep local session on server outages.
                if ((int)renewResponse.StatusCode >= 500)
                    return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Offline, "Could not renew session.");

                return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Invalid, "Session expired.");
            }

            var raw = await renewResponse.Content.ReadAsStringAsync(cancellationToken);
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "{}" : raw);
            var root = UnwrapApiPayload(doc.RootElement);
            var userData = ExtractUserData(root);
            if (userData is null || string.IsNullOrWhiteSpace(userData.Token))
                return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Invalid, "Renew response invalid.");

            if (!long.TryParse(userData.Id, out var userId) || userId <= 0)
                userId = profile?.UserId ?? 0;
            if (userId <= 0)
                return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Invalid, "Renew response missing user id.");

            var renewedProfile = new DesktopUserProfile(
                userId,
                userData.UserName ?? profile?.UserName ?? string.Empty,
                userData.FullName ?? userData.Name ?? profile?.DisplayName ?? string.Empty,
                userData.Email ?? profile?.Email ?? string.Empty,
                userData.Role ?? profile?.Role ?? "user",
                userData.AvatarUrl ?? profile?.AvatarUrl);

            var expires = TryReadJwtExpiryUtc(userData.Token) ?? DateTime.UtcNow.AddHours(12);
            await _sessionStore.SaveAsync(renewedProfile, userData.Token, expires, cancellationToken);
            return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Valid);
        }
        catch (HttpRequestException)
        {
            return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Offline, "Network unavailable.");
        }
        catch (TaskCanceledException)
        {
            return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Offline, "Network timeout.");
        }
        catch
        {
            return new DesktopSessionCheckResult(DesktopSessionCheckStatus.Offline, "Session check failed.");
        }
    }

    public async Task<DesktopAccessStatus> RegisterDesktopDeviceAsync(string appVersion, CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);
        await _settings.EnsureInitializedAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/RegisterDevice",
            new
            {
                deviceId = _settings.DeviceId,
                machineName = Environment.MachineName,
                osVersion = Environment.OSVersion.ToString(),
                appVersion,
            },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(await response.Content.ReadAsStringAsync(cancellationToken))
                ?? "ثبت دستگاه ناموفق بود.";
            return new DesktopAccessStatus(false, message, false, false, null);
        }

        var dto = await response.Content.ReadFromJsonAsync<DesktopAccessDto>(JsonOptions, cancellationToken);
        return MapAccess(dto);
    }

    public async Task LogoutDesktopSessionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await EnsureBaseAddressAsync(cancellationToken);
            await AttachAuthAsync(cancellationToken);
            await _settings.EnsureInitializedAsync(cancellationToken);

            using var response = await _http.PostAsJsonAsync(
                "DesktopDrm/LogoutSession",
                new { deviceId = _settings.DeviceId },
                cancellationToken);
            _ = response;
        }
        catch
        {
            // Local logout must proceed even if the network call fails.
        }
    }

    public async Task<DesktopAccessStatus> GetDesktopAccessStatusAsync(bool checkVideoPlayback = false, CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);
        await _settings.EnsureInitializedAsync(cancellationToken);

        var url =
            $"DesktopDrm/AccessStatus?deviceId={Uri.EscapeDataString(_settings.DeviceId)}&checkVideoPlayback={checkVideoPlayback.ToString().ToLowerInvariant()}";
        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopAccessStatus(true, null, false, false, null);

        var dto = await response.Content.ReadFromJsonAsync<DesktopAccessDto>(JsonOptions, cancellationToken);
        return MapAccess(dto);
    }

    public async Task<AppUpdateCheckResult> CheckForUpdateAsync(
        string currentVersion,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);

        var url = $"DesktopApp/CheckUpdate?currentVersion={Uri.EscapeDataString(currentVersion)}";
        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new AppUpdateCheckResult(false, false, currentVersion, null, null, null);

        var payload = await response.Content.ReadFromJsonAsync<DesktopUpdateDto>(JsonOptions, cancellationToken);
        if (payload is null)
            return new AppUpdateCheckResult(false, false, currentVersion, null, null, null);

        return new AppUpdateCheckResult(
            payload.UpdateAvailable,
            payload.IsMandatory,
            currentVersion,
            payload.LatestVersion,
            payload.InstallerUrl,
            payload.ReleaseNotes);
    }

    public async Task<IReadOnlyList<DesktopEncryptedMediaItem>> GetEncryptedMediaAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"DesktopDrm/MyEncryptedMedia?deviceId={Uri.EscapeDataString(_settings.DeviceId)}", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var items = await response.Content.ReadFromJsonAsync<List<DesktopEncryptedMediaDto>>(JsonOptions, cancellationToken);
        return items?.Select(x => new DesktopEncryptedMediaItem(
            x.MediaAssetId,
            x.Title ?? x.OriginalFileName ?? "Media",
            x.OriginalFileName ?? string.Empty,
            x.MimeType ?? "video/mp4",
            x.FileSizeBytes,
            x.EncryptedFileUrl,
            x.CourseId,
            x.CourseTitle)).ToList() ?? [];
    }

    public async Task<DesktopLicenseValidationResult> ValidateDesktopLicenseAsync(
        string licenseKey,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);
        await _settings.EnsureInitializedAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/ValidateDesktopLicense",
            new
            {
                licenseKey,
                deviceId = _settings.DeviceId,
                osVersion = Environment.OSVersion.ToString(),
                machineName = Environment.MachineName,
            },
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "کلید لایسنس نامعتبر است.";
            return new DesktopLicenseValidationResult(false, message, 0, 0, string.Empty, string.Empty);
        }

        var payload = ApiJsonHelper.ReadObject<DesktopLicenseValidationDto>(raw);
        if (payload is null || payload.CourseId <= 0)
            return new DesktopLicenseValidationResult(false, "پاسخ تأیید لایسنس نامعتبر است.", 0, 0, string.Empty, string.Empty);

        return new DesktopLicenseValidationResult(
            true,
            null,
            payload.EnrollmentId,
            payload.CourseId,
            payload.CourseTitle ?? string.Empty,
            payload.LicenseKey ?? licenseKey.Trim());
    }

    public async Task<IReadOnlyList<DesktopLicensedCourse>> GetMyLicensedCoursesAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("DesktopDrm/MyLicensedCourses", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<DesktopLicensedCourseDto>(raw)
            .Select(x => new DesktopLicensedCourse(
                x.CourseId,
                x.CourseTitle ?? string.Empty,
                x.DesktopLicenseKey,
                x.IsActive,
                x.TeacherId,
                string.IsNullOrWhiteSpace(x.TeacherName) ? "مدرس" : x.TeacherName!))
            .ToList();
    }

    public async Task<DesktopCourseCurriculum?> GetCourseCurriculumAsync(
        long courseId,
        string? licenseKey,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url = $"DesktopDrm/CourseCurriculum?courseId={courseId}";
        if (!string.IsNullOrWhiteSpace(licenseKey))
            url += $"&licenseKey={Uri.EscapeDataString(licenseKey.Trim())}";

        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var payload = ApiJsonHelper.ReadObject<DesktopCourseCurriculumDto>(raw);
        if (payload is null || payload.CourseId <= 0) return null;

        return new DesktopCourseCurriculum(
            payload.CourseId,
            payload.CourseTitle ?? string.Empty,
            payload.Sections?.Select(s => new DesktopCourseSectionItem(
                s.SectionId,
                s.Title ?? string.Empty,
                s.HasMaterials,
                MapCurriculumMaterials(s.Materials),
                s.Lessons?.Select(l => new DesktopCourseLessonItem(
                    l.LessonId,
                    l.Title ?? string.Empty,
                    l.VideoTitle,
                    l.DurationSeconds,
                    l.IsPublished,
                    l.MediaAssetId,
                    l.HasEncryptedVideo,
                    l.IsLocked,
                    l.HasMaterials,
                    MapCurriculumMaterials(l.Materials))).ToList() ?? [])).ToList() ?? []);
    }

    private static IReadOnlyList<DesktopCourseCurriculumMaterialDto> MapCurriculumMaterials(
        List<DesktopCourseCurriculumMaterialDtoContract>? materials) =>
        materials?.Select(m => new DesktopCourseCurriculumMaterialDto(
            m.MaterialId,
            m.MediaAssetId,
            m.DisplayName ?? string.Empty,
            m.OriginalFileName,
            m.FileSizeBytes,
            m.IsEncrypted)).ToList() ?? [];

    public async Task<OfflineGrantResult> RequestOfflineGrantAsync(
        long courseId,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/RequestOfflineGrant",
            new
            {
                courseId,
                deviceId,
                osVersion = Environment.OSVersion.ToString(),
                machineName = Environment.MachineName,
            },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(await response.Content.ReadAsStringAsync(cancellationToken)) ?? "Grant request failed.";
            return new OfflineGrantResult(false, message, null, courseId, null);
        }

        var payload = await response.Content.ReadFromJsonAsync<OfflineGrantDto>(JsonOptions, cancellationToken);
        if (payload is null)
            return new OfflineGrantResult(false, "Invalid grant response.", null, courseId, null);

        return new OfflineGrantResult(
            true,
            null,
            string.IsNullOrWhiteSpace(payload.GrantToken) ? null : payload.GrantToken,
            payload.CourseId,
            payload.ExpiresAtUtc);
    }

    public async Task<DesktopPlaybackPackage?> GetPlaybackPackageAsync(
        long mediaAssetId,
        string grantToken,
        long? courseId,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url = $"DesktopDrm/PlaybackPackage?mediaAssetId={mediaAssetId}&grantToken={Uri.EscapeDataString(grantToken)}&deviceId={Uri.EscapeDataString(_settings.DeviceId)}";
        if (courseId is > 0)
            url += $"&courseId={courseId.Value}";

        using var response = await _http.GetAsync(url, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw)
                ?? (response.StatusCode == System.Net.HttpStatusCode.NoContent
                    ? "بسته پخش برای این دستگاه یافت نشد."
                    : $"دریافت بسته پخش ناموفق بود ({(int)response.StatusCode}).");
            throw new InvalidOperationException(message);
        }

        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("بسته پخش از سرور خالی برگشت.");

        var payload = ApiJsonHelper.ReadObject<DesktopPlaybackDto>(raw)
            ?? System.Text.Json.JsonSerializer.Deserialize<DesktopPlaybackDto>(raw, JsonOptions);
        if (payload is null)
            throw new InvalidOperationException("پاسخ بسته پخش نامعتبر است.");

        return new DesktopPlaybackPackage(
            payload.MediaAssetId,
            payload.Title ?? "Media",
            payload.MimeType ?? "video/mp4",
            payload.EncryptedFileUrl ?? string.Empty,
            payload.EncryptionAlgorithm ?? "AES-256-CBC",
            payload.IvBase64 ?? string.Empty,
            payload.WrappedContentKeyBase64 ?? string.Empty,
            payload.ContentChecksumSha256,
            payload.GrantExpiresAtUtc);
    }

    public async Task<byte[]> DownloadEncryptedBytesAsync(string encryptedFileUrl, CancellationToken cancellationToken = default)
    {
        await using var download = await OpenEncryptedDownloadAsync(encryptedFileUrl, cancellationToken);
        using var ms = new MemoryStream();
        await download.Stream.CopyToAsync(ms, cancellationToken);
        return ms.ToArray();
    }

    public async Task<DesktopEncryptedDownload> OpenEncryptedDownloadAsync(
        string encryptedFileUrl,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var mediaHttp = CreateMediaHttpClient();
        HttpResponseMessage? response = null;

        try
        {
            if (!string.IsNullOrWhiteSpace(encryptedFileUrl) &&
                (encryptedFileUrl.StartsWith("DesktopDrm/", StringComparison.OrdinalIgnoreCase) ||
                 encryptedFileUrl.Contains("DownloadEncrypted", StringComparison.OrdinalIgnoreCase)))
            {
                var relative = encryptedFileUrl.TrimStart('/');
                response = await mediaHttp.GetAsync(relative, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            }
            else
            {
                var absolute = ResolveMediaUrl(encryptedFileUrl);
                response = await mediaHttp.GetAsync(absolute, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            }

            response.EnsureSuccessStatusCode();
            var length = response.Content.Headers.ContentLength;
            var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            // Ownership transferred to DesktopEncryptedDownload.
            var download = new DesktopEncryptedDownload(stream, length, response, mediaHttp);
            response = null;
            return download;
        }
        catch
        {
            response?.Dispose();
            mediaHttp.Dispose();
            throw;
        }
    }

    private HttpClient CreateMediaHttpClient()
    {
        // Dedicated client so long media downloads are not killed by the default 100s HttpClient timeout.
        var mediaHttp = new HttpClient { Timeout = TimeSpan.FromHours(3) };
        if (_http.BaseAddress is not null)
            mediaHttp.BaseAddress = _http.BaseAddress;

        if (_http.DefaultRequestHeaders.Authorization is not null)
            mediaHttp.DefaultRequestHeaders.Authorization = _http.DefaultRequestHeaders.Authorization;

        foreach (var header in _http.DefaultRequestHeaders)
        {
            if (string.Equals(header.Key, "Authorization", StringComparison.OrdinalIgnoreCase))
                continue;
            if (!mediaHttp.DefaultRequestHeaders.Contains(header.Key))
                mediaHttp.DefaultRequestHeaders.TryAddWithoutValidation(header.Key, header.Value);
        }

        return mediaHttp;
    }

    public async Task<IReadOnlyList<DesktopChatThread>> GetSupportConversationsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var user = await _sessionStore.GetCurrentUserAsync(cancellationToken);
        if (user is null) return [];

        using var response = await _http.GetAsync("SupportChat/GetMyConversations", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var items = ApiJsonHelper.ReadList<SupportConversationDto>(raw);
        return items.Select(x =>
        {
            var isStudent = user.UserId == x.StudentUserId;
            var peerUserId = isStudent ? x.TeacherUserId : x.StudentUserId;
            return new DesktopChatThread(
                x.Id,
                peerUserId,
                x.OtherParticipantName ?? "کاربر",
                x.Subject ?? string.Empty,
                x.LastMessagePreview,
                x.LastMessageAtUtc,
                x.UnreadCount,
                x.TeacherUserId,
                x.StudentUserId);
        }).ToList();
    }

    public async Task<IReadOnlyList<DesktopSupportTeacherOption>> GetStudentSupportTeachersAsync(
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("SupportChat/GetStudentTeachers", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<SupportTeacherOptionDto>(raw)
            .Where(x => x.TeacherUserId > 0)
            .Select(x => new DesktopSupportTeacherOption(
                x.TeacherUserId,
                string.IsNullOrWhiteSpace(x.DisplayName) ? "استاد" : x.DisplayName!,
                x.Email,
                x.Source))
            .GroupBy(x => x.TeacherUserId)
            .Select(g => g.First())
            .OrderBy(x => x.DisplayName)
            .ToList();
    }

    public async Task<long?> OpenSupportConversationAsync(
        long teacherUserId,
        string subject,
        string? initialMessageHtml = null,
        CancellationToken cancellationToken = default)
    {
        if (teacherUserId <= 0 || string.IsNullOrWhiteSpace(subject))
            return null;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var body = new Dictionary<string, object?>
        {
            ["teacherUserId"] = teacherUserId,
            ["TeacherUserId"] = teacherUserId,
            ["subject"] = subject.Trim(),
            ["Subject"] = subject.Trim(),
        };
        if (!string.IsNullOrWhiteSpace(initialMessageHtml))
        {
            body["initialMessageHtml"] = initialMessageHtml.Trim();
            body["InitialMessageHtml"] = initialMessageHtml.Trim();
        }

        using var response = await _http.PostAsJsonAsync("SupportChat/Open", body, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(TryReadErrorMessage(raw) ?? "ایجاد موضوع پشتیبانی ناموفق بود.");

        var id = TryReadCreatedId(raw);
        return id > 0 ? id : null;
    }

    public async Task<DesktopChatUploadResult> UploadSupportChatMediaAsync(
        string filePath,
        DesktopChatMediaKind mediaKind,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return new DesktopChatUploadResult(false, "فایل انتخاب‌شده یافت نشد.", null, mediaKind, null);

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var endpoint = mediaKind switch
        {
            DesktopChatMediaKind.Audio => "SupportChat/UploadAudio",
            DesktopChatMediaKind.Video => "SupportChat/UploadVideo",
            _ => "SupportChat/UploadImage", // image + generic file attachment
        };

        await using var stream = File.OpenRead(filePath);
        using var content = new MultipartFormDataContent();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GuessChatMimeType(filePath, mediaKind));
        var fileName = Path.GetFileName(filePath);
        content.Add(fileContent, "file", fileName);

        using var response = await _http.PostAsync(endpoint, content, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "آپلود فایل پیام‌رسان ناموفق بود.";
            return new DesktopChatUploadResult(false, message, null, mediaKind, fileName);
        }

        var payload = ApiJsonHelper.ReadObject<ChatUploadDto>(raw);
        if (payload is null || string.IsNullOrWhiteSpace(payload.Url))
            return new DesktopChatUploadResult(false, "پاسخ آپلود نامعتبر است.", null, mediaKind, fileName);

        return new DesktopChatUploadResult(true, null, payload.Url, mediaKind, fileName);
    }

    public async Task<DesktopConversationDetail?> GetSupportConversationAsync(
        long conversationId,
        int messageTake = 30,
        long? beforeMessageId = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url = $"SupportChat/GetById?conversationId={conversationId}&messageTake={messageTake}";
        if (beforeMessageId is > 0)
            url += $"&beforeMessageId={beforeMessageId.Value}";

        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<SupportConversationDetailDto>(raw);
        if (dto is null) return null;

        return new DesktopConversationDetail(
            dto.Id,
            dto.StudentUserId,
            dto.TeacherUserId,
            dto.Subject ?? string.Empty,
            dto.Status ?? "Open",
            dto.HasMoreOlderMessages,
            dto.Messages?.Select(m => new DesktopChatMessageDto(
                m.Id,
                m.SenderUserId,
                m.SenderName ?? string.Empty,
                m.ContentHtml ?? string.Empty,
                m.SentAtUtc,
                m.IsMine,
                m.IsDeleted,
                m.EditedAtUtc,
                m.ReplyToMessageId,
                m.ReplyToSenderName,
                m.ReplyToContentPreview)).ToList() ?? []);
    }

    public async Task<long?> SendSupportMessageAsync(
        long conversationId,
        string contentHtml,
        long? replyToMessageId = null,
        string? clientMessageId = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/SendMessage",
            new { conversationId, contentHtml, replyToMessageId, clientMessageId },
            cancellationToken);

        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (long.TryParse(raw.Trim('"'), out var directId) && directId > 0)
            return directId;

        var layer = ApiJsonHelper.ReadObject<Dictionary<string, object>>(raw);
        if (layer is null) return null;

        foreach (var key in new[] { "id", "Id", "data", "Data" })
        {
            if (!layer.TryGetValue(key, out var value) || value is null) continue;
            if (long.TryParse(value.ToString(), out var parsed) && parsed > 0)
                return parsed;
        }

        return null;
    }

    public async Task<bool> UpdateSupportMessageAsync(
        long conversationId,
        long messageId,
        string contentHtml,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/UpdateMessage",
            new { conversationId, messageId, contentHtml },
            cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteSupportMessageAsync(
        long conversationId,
        long messageId,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/DeleteMessage",
            new { conversationId, messageId },
            cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task MarkSupportConversationReadAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);
        using var response = await _http.PostAsJsonAsync(
            "SupportChat/MarkRead",
            new { conversationId },
            cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task<IReadOnlyList<DesktopTeacherStory>> GetActiveStoriesAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("SupportChat/GetActiveStories", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var items = ApiJsonHelper.ReadList<TeacherStoryDto>(raw);
        return items.Select(x => new DesktopTeacherStory(
            x.Id,
            x.TeacherUserId,
            x.TeacherName ?? "استاد",
            x.Caption ?? string.Empty,
            x.MediaUrl,
            x.ThumbnailUrl,
            x.ExpiresAtUtc,
            ParseStoryMediaKind(x.MediaKind),
            x.DurationSeconds > 0 ? x.DurationSeconds : 5,
            x.TeacherAvatarUrl,
            x.HasUnseen)).ToList();
    }

    public async Task<DesktopStoryPublishResult> PublishStoryAsync(
        string caption,
        string? mediaUrl,
        int mediaKind,
        int? durationSeconds = null,
        string? thumbnailUrl = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/PublishStory",
            new
            {
                caption,
                mediaUrl,
                thumbnailUrl,
                mediaKind,
                durationSeconds,
            },
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "انتشار استوری ناموفق بود.";
            return new DesktopStoryPublishResult(false, message, 0);
        }

        var storyId = TryReadCreatedId(raw);
        return storyId > 0
            ? new DesktopStoryPublishResult(true, null, storyId)
            : new DesktopStoryPublishResult(false, "پاسخ انتشار استوری نامعتبر است.", 0);
    }

    public async Task<bool> RegisterStoryViewAsync(long storyId, CancellationToken cancellationToken = default)
    {
        if (storyId <= 0) return false;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/RegisterStoryView",
            new { storyId },
            cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> DeleteStoryAsync(long storyId, CancellationToken cancellationToken = default)
    {
        if (storyId <= 0) return false;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/DeleteStory",
            new { storyId },
            cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<DesktopStoryUploadResult> UploadStoryMediaAsync(
        string filePath,
        string? mediaKindHint = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return new DesktopStoryUploadResult(false, "فایل انتخاب‌شده یافت نشد.", null, DesktopStoryMediaKind.None);

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        await using var stream = File.OpenRead(filePath);
        using var content = new MultipartFormDataContent();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(GuessStoryMimeType(filePath));
        content.Add(fileContent, "file", Path.GetFileName(filePath));
        if (!string.IsNullOrWhiteSpace(mediaKindHint))
            content.Add(new StringContent(mediaKindHint), "mediaKind");

        using var response = await _http.PostAsync("SupportChat/UploadStoryMedia", content, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "آپلود فایل استوری ناموفق بود.";
            return new DesktopStoryUploadResult(false, message, null, DesktopStoryMediaKind.None);
        }

        var payload = ApiJsonHelper.ReadObject<StoryUploadDto>(raw);
        if (payload is null || string.IsNullOrWhiteSpace(payload.Url))
            return new DesktopStoryUploadResult(false, "پاسخ آپلود نامعتبر است.", null, DesktopStoryMediaKind.None);

        return new DesktopStoryUploadResult(
            true,
            null,
            payload.Url,
            ParseStoryMediaKind(payload.MediaKind));
    }

    public async Task HeartbeatPresenceAsync(
        string? connectionId,
        string? appVersion,
        string? deviceId,
        bool isOnline = true,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "SupportChat/HeartbeatPresence",
            new { connectionId, appVersion, deviceId, isOnline },
            cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task<bool> GetUserPresenceOnlineAsync(long userId, CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"SupportChat/GetUserPresence?userId={userId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return false;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<PresenceDto>(raw);
        return dto?.IsOnline == true;
    }

    public async Task<bool> GetVipAccessAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("SupportSubscription/GetMyStatus", cancellationToken);
        if (!response.IsSuccessStatusCode) return false;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<VipStatusDto>(raw);
        return dto?.HasActiveAccess == true;
    }

    public async Task<string?> CreateWebHandoffCodeAsync(
        string? returnUrl = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Account/CreateWebHandoff",
            new { returnUrl },
            cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<WebHandoffDto>(raw);
        if (!string.IsNullOrWhiteSpace(dto?.Code))
            return dto.Code.Trim();

        // Some API envelopes nest under data
        var nested = ApiJsonHelper.ReadObject<Dictionary<string, object>>(raw);
        if (nested is not null)
        {
            foreach (var key in new[] { "code", "Code", "data", "Data" })
            {
                if (!nested.TryGetValue(key, out var value) || value is null) continue;
                if (value is System.Text.Json.JsonElement el)
                {
                    if (el.ValueKind == System.Text.Json.JsonValueKind.String)
                        return el.GetString()?.Trim();
                    if (el.ValueKind == System.Text.Json.JsonValueKind.Object
                        && el.TryGetProperty("code", out var codeProp)
                        && codeProp.ValueKind == System.Text.Json.JsonValueKind.String)
                        return codeProp.GetString()?.Trim();
                    if (el.ValueKind == System.Text.Json.JsonValueKind.Object
                        && el.TryGetProperty("Code", out var codeProp2)
                        && codeProp2.ValueKind == System.Text.Json.JsonValueKind.String)
                        return codeProp2.GetString()?.Trim();
                }
                else
                {
                    var text = value.ToString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(text) && text.Length > 8 && !text.StartsWith('{'))
                        return text;
                }
            }
        }

        return null;
    }

    public async Task<DesktopRemoteAssistSession?> GetMyRemoteAssistSessionAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("RemoteAssist/GetMyActive", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<RemoteAssistSessionDto>(raw);
        return dto is null || dto.SessionId <= 0 ? null : MapRemoteAssist(dto);
    }

    public async Task<IReadOnlyList<DesktopRemoteAssistSession>> GetPendingRemoteAssistSessionsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("RemoteAssist/GetPendingForTeacher", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<RemoteAssistSessionDto>(raw)
            .Select(MapRemoteAssist)
            .ToList();
    }

    public Task<DesktopRemoteAssistRequestResult> RequestRemoteAssistSessionAsync(CancellationToken cancellationToken = default) =>
        EnsureRemoteAssistSessionAsync(cancellationToken);

    public async Task<DesktopRemoteAssistRequestResult> EnsureRemoteAssistSessionAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsync("RemoteAssist/EnsureSession", null, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "آماده‌سازی نشست کمک از راه دور ناموفق بود.";
            return new DesktopRemoteAssistRequestResult(false, message, null);
        }

        var dto = ApiJsonHelper.ReadObject<RemoteAssistSessionDto>(raw);
        if (dto is null || dto.SessionId <= 0)
            return new DesktopRemoteAssistRequestResult(false, "پاسخ سرور نامعتبر است.", null);

        return new DesktopRemoteAssistRequestResult(true, null, MapRemoteAssist(dto));
    }

    public async Task<DesktopRemoteAssistRequestResult> ChangeRemoteAssistPasswordAsync(
        long sessionId,
        string? newPassword = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/ChangePassword",
            new { sessionId, newPassword },
            cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "تغییر رمز ناموفق بود.";
            return new DesktopRemoteAssistRequestResult(false, message, null);
        }

        var dto = ApiJsonHelper.ReadObject<RemoteAssistSessionDto>(raw);
        if (dto is null || dto.SessionId <= 0)
            return new DesktopRemoteAssistRequestResult(false, "پاسخ سرور نامعتبر است.", null);

        return new DesktopRemoteAssistRequestResult(true, null, MapRemoteAssist(dto));
    }

    public async Task<DesktopRemoteAssistAcceptResult> AcceptRemoteAssistSessionAsync(
        string sessionCode,
        string sessionUsername,
        string sessionPassword,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/RequestConnect",
            new
            {
                oneTimeSessionCode = sessionCode.Trim(),
                sessionUsername = sessionUsername.Trim(),
                sessionPassword = sessionPassword.Trim(),
            },
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "درخواست اتصال ناموفق بود.";
            return new DesktopRemoteAssistAcceptResult(false, message, 0, 0);
        }

        var dto = ApiJsonHelper.ReadObject<RemoteAssistAcceptedDto>(raw);
        if (dto is null || dto.SessionId <= 0)
            return new DesktopRemoteAssistAcceptResult(false, "پاسخ سرور نامعتبر است.", 0, 0);

        return new DesktopRemoteAssistAcceptResult(true, null, dto.SessionId, dto.RequesterUserId, dto.Status);
    }

    public async Task<DesktopRemoteAssistRequestResult> ConfirmRemoteAssistConsentAsync(
        long sessionId,
        bool allowRemoteControl,
        bool allowClipboard,
        bool allowFileTransfer,
        bool allowAudio,
        bool allowLockLocalInput,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/ConfirmConsent",
            new
            {
                sessionId,
                allowRemoteControl,
                allowClipboard,
                allowFileTransfer,
                allowAudio,
                allowLockLocalInput,
            },
            cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopRemoteAssistRequestResult(false, TryReadErrorMessage(raw) ?? "تأیید دسترسی ناموفق بود.", null);

        var dto = ApiJsonHelper.ReadObject<RemoteAssistSessionDto>(raw);
        return dto is null || dto.SessionId <= 0
            ? new DesktopRemoteAssistRequestResult(false, "پاسخ سرور نامعتبر است.", null)
            : new DesktopRemoteAssistRequestResult(true, null, MapRemoteAssist(dto));
    }

    public async Task<DesktopRemoteAssistRequestResult> DenyRemoteAssistConsentAsync(
        long sessionId,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/DenyConsent",
            new { sessionId },
            cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopRemoteAssistRequestResult(false, TryReadErrorMessage(raw) ?? "رد دسترسی ناموفق بود.", null);

        var dto = ApiJsonHelper.ReadObject<RemoteAssistSessionDto>(raw);
        return dto is null || dto.SessionId <= 0
            ? new DesktopRemoteAssistRequestResult(false, "پاسخ سرور نامعتبر است.", null)
            : new DesktopRemoteAssistRequestResult(true, null, MapRemoteAssist(dto));
    }

    public async Task<DesktopRemoteAssistHistoryPage> GetRemoteAssistHistoryAsync(
        long? studentUserId = null,
        long? teacherUserId = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var qs = $"RemoteAssist/History?pageNumber={pageNumber}&pageSize={pageSize}";
        if (studentUserId is > 0) qs += $"&studentUserId={studentUserId}";
        if (teacherUserId is > 0) qs += $"&teacherUserId={teacherUserId}";

        using var response = await _http.GetAsync(qs, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopRemoteAssistHistoryPage(pageNumber, pageSize, 0, []);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<RemoteAssistHistoryDto>(raw);
        if (dto is null)
            return new DesktopRemoteAssistHistoryPage(pageNumber, pageSize, 0, []);

        var items = (dto.Items ?? [])
            .Select(MapRemoteAssist)
            .ToList();
        return new DesktopRemoteAssistHistoryPage(dto.PageNumber, dto.PageSize, dto.TotalCount, items);
    }

    public async Task<bool> EndRemoteAssistSessionAsync(long sessionId, CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/End",
            new { sessionId },
            cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<DesktopPagedResult<DesktopTeacherCourseItem>> SearchMyCoursesAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url =
            $"Course/SearchMyCourses?inputValue={Uri.EscapeDataString(search ?? string.Empty)}&pageNumber={pageNumber}&pageSize={pageSize}&needTotalCount=true";
        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopPagedResult<DesktopTeacherCourseItem>([], pageNumber, pageSize, 0);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var paged = ApiJsonHelper.ReadPaged<TeacherCourseDto>(raw);
        var items = paged.Items
            .Select(x => new DesktopTeacherCourseItem(
                x.Id,
                x.Title ?? string.Empty,
                x.Status,
                x.StudentCount,
                x.Price,
                x.CategoryName))
            .ToList();
        return new DesktopPagedResult<DesktopTeacherCourseItem>(items, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }

    public async Task<DesktopPagedResult<DesktopTeacherCourseItem>> SearchCoursesAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url =
            $"Course/Search?inputValue={Uri.EscapeDataString(search ?? string.Empty)}&pageNumber={pageNumber}&pageSize={pageSize}&needTotalCount=true";
        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopPagedResult<DesktopTeacherCourseItem>([], pageNumber, pageSize, 0);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var paged = ApiJsonHelper.ReadPaged<TeacherCourseDto>(raw);
        var items = paged.Items
            .Select(x => new DesktopTeacherCourseItem(
                x.Id,
                x.Title ?? string.Empty,
                x.Status,
                x.StudentCount,
                x.Price,
                x.CategoryName))
            .ToList();
        return new DesktopPagedResult<DesktopTeacherCourseItem>(items, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }

    public async Task<DesktopPagedResult<DesktopTeacherSearchItem>> SearchTeachersAsync(
        string? search = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url =
            $"Teacher/Search?inputValue={Uri.EscapeDataString(search ?? string.Empty)}&pageNumber={pageNumber}&pageSize={pageSize}&needTotalCount=true&forAdmin=true";
        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new DesktopPagedResult<DesktopTeacherSearchItem>([], pageNumber, pageSize, 0);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var paged = ApiJsonHelper.ReadPaged<TeacherSearchDto>(raw);
        var items = paged.Items
            .Select(MapTeacherSearchItem)
            .Where(x => x.TeacherId > 0)
            .ToList();
        return new DesktopPagedResult<DesktopTeacherSearchItem>(items, paged.PageNumber, paged.PageSize, paged.TotalCount);
    }

    public async Task<DesktopOperationResult> SetTeacherAccountStatusAsync(
        long teacherId,
        string status,
        string? note = null,
        CancellationToken cancellationToken = default)
    {
        if (teacherId <= 0)
            return new DesktopOperationResult(false, "شناسه استاد نامعتبر است.");

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Teacher/SetAccountStatus",
            new { teacherId, status, note },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(await response.Content.ReadAsStringAsync(cancellationToken))
                ?? "تغییر وضعیت حساب ناموفق بود.";
            return new DesktopOperationResult(false, message);
        }

        return new DesktopOperationResult(true, null);
    }

    public async Task<IReadOnlyList<DesktopOnlineDesktopUser>> GetOnlineDesktopUsersAsync(
        int take = 200,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"SupportChat/GetOnlineDesktopUsers?take={take}", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<DesktopOnlineUserDto>(raw)
            .Select(x => new DesktopOnlineDesktopUser(
                x.UserId,
                x.DisplayName ?? string.Empty,
                x.Role,
                x.Status ?? string.Empty,
                x.AppVersion,
                x.DeviceId,
                x.LastSeenAtUtc))
            .Where(x => x.UserId > 0)
            .ToList();
    }

    public async Task<DesktopOperationResult> BlockDesktopUserAccessAsync(
        long userId,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return new DesktopOperationResult(false, "شناسه کاربر نامعتبر است.");

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/BlockUserAccess",
            new { userId, scope = 1, reason },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(await response.Content.ReadAsStringAsync(cancellationToken))
                ?? "مسدودسازی کاربر ناموفق بود.";
            return new DesktopOperationResult(false, message);
        }

        return new DesktopOperationResult(true, null);
    }

    public async Task<IReadOnlyList<DesktopEnrolledStudent>> GetMyEnrolledStudentsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("Course/GetMyEnrolledStudents", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<EnrolledStudentDto>(raw)
            .Select(MapEnrolledStudent)
            .Where(x => x.StudentId > 0 && x.CourseId > 0)
            .ToList();
    }

    public async Task<DesktopOperationResult> RemoveMyStudentAsync(long portalUserId, CancellationToken cancellationToken = default)
    {
        if (portalUserId <= 0)
            return new DesktopOperationResult(false, "شناسه دانشجو نامعتبر است.");

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Course/RemoveMyStudent",
            new { portalUserId },
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(await response.Content.ReadAsStringAsync(cancellationToken))
                ?? "حذف دانشجو ناموفق بود.";
            return new DesktopOperationResult(false, message);
        }

        return new DesktopOperationResult(true, null);
    }

    public async Task<DesktopApproveEnrollmentResult> ApproveEnrollmentAsync(
        long enrollmentId,
        CancellationToken cancellationToken = default)
    {
        if (enrollmentId <= 0)
            return new DesktopApproveEnrollmentResult(false, "شناسه ثبت‌نام نامعتبر است.", 0, null, string.Empty);

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Course/ApproveEnrollment",
            new { enrollmentId },
            cancellationToken);

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "تأیید ثبت‌نام ناموفق بود.";
            return new DesktopApproveEnrollmentResult(false, message, 0, null, string.Empty);
        }

        var payload = ApiJsonHelper.ReadObject<ApproveEnrollmentDto>(raw);
        if (payload is null || payload.EnrollmentId <= 0)
            return new DesktopApproveEnrollmentResult(false, "پاسخ تأیید ثبت‌نام نامعتبر است.", 0, null, string.Empty);

        return new DesktopApproveEnrollmentResult(
            true,
            null,
            payload.EnrollmentId,
            payload.SpotPlayerLicense,
            payload.CourseTitle ?? string.Empty);
    }

    public async Task<IReadOnlyList<DesktopStudentDesktopLicense>> GetStudentDesktopLicensesAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0) return [];

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"DesktopDrm/StudentDesktopLicenses?userId={userId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<StudentDesktopLicenseDto>(raw)
            .Select(MapStudentDesktopLicense)
            .Where(x => x.EnrollmentId > 0)
            .ToList();
    }

    public async Task<DesktopLicenseOperationResult> CreateStudentDesktopLicenseAsync(
        long userId,
        long courseId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/CreateStudentDesktopLicense",
            new { userId, courseId, expiresAtUtc },
            cancellationToken);

        return await ReadLicenseOperationResultAsync(response, cancellationToken);
    }

    public async Task<DesktopLicenseOperationResult> RevokeStudentDesktopLicenseAsync(
        long enrollmentId,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/RevokeStudentDesktopLicense",
            new { enrollmentId },
            cancellationToken);

        return await ReadLicenseOperationResultAsync(response, cancellationToken);
    }

    public async Task<DesktopLicenseOperationResult> RenewStudentDesktopLicenseAsync(
        long enrollmentId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/RenewStudentDesktopLicense",
            new { enrollmentId, expiresAtUtc },
            cancellationToken);

        return await ReadLicenseOperationResultAsync(response, cancellationToken);
    }

    public async Task<DesktopLicenseOperationResult> RegenerateStudentDesktopLicenseAsync(
        long enrollmentId,
        DateTime? expiresAtUtc = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/RegenerateStudentDesktopLicense",
            new { enrollmentId, expiresAtUtc },
            cancellationToken);

        return await ReadLicenseOperationResultAsync(response, cancellationToken);
    }

    public async Task<int> DeleteRemoteAssistHistoryAsync(
        long? sessionId = null,
        long? studentUserId = null,
        long? teacherUserId = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "RemoteAssist/DeleteHistory",
            new
            {
                sessionId = sessionId is > 0 ? sessionId : null,
                studentUserId = studentUserId is > 0 ? studentUserId : null,
                teacherUserId = teacherUserId is > 0 ? teacherUserId : null,
            },
            cancellationToken);
        if (!response.IsSuccessStatusCode) return 0;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(raw);
            var root = doc.RootElement;
            if (root.TryGetProperty("data", out var data) || root.TryGetProperty("Data", out data))
            {
                if (data.TryGetProperty("queryResult", out var qr) || data.TryGetProperty("QueryResult", out qr))
                {
                    if (qr.ValueKind == System.Text.Json.JsonValueKind.Number) return qr.GetInt32();
                }
                if (data.ValueKind == System.Text.Json.JsonValueKind.Number) return data.GetInt32();
            }
            if (root.ValueKind == System.Text.Json.JsonValueKind.Number) return root.GetInt32();
        }
        catch
        {
            // ignore parse errors
        }

        return response.IsSuccessStatusCode ? 1 : 0;
    }

    public async Task<DesktopWatermarkForPlayback?> GetWatermarkForPlaybackAsync(
        long courseId,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0) return null;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"DesktopDrm/WatermarkForPlayback?courseId={courseId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<WatermarkForPlaybackDto>(raw);
        return dto is null || dto.CourseId <= 0 ? null : MapWatermark(dto);
    }

    public async Task ReportPlaybackTelemetryAsync(
        long courseId,
        long lessonId,
        DesktopPlaybackTelemetryKind kind,
        int positionSeconds,
        int watchedDeltaSeconds,
        long? enrollmentId = null,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0 || lessonId <= 0) return;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);
        await _settings.EnsureInitializedAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "DesktopDrm/ReportPlaybackTelemetry",
            new
            {
                courseId,
                lessonId,
                enrollmentId,
                deviceId = _settings.DeviceId,
                kind = (byte)kind,
                positionSeconds,
                watchedDeltaSeconds,
            },
            cancellationToken);
        _ = response;
    }

    public async Task<IReadOnlyList<DesktopAssignedExam>> GetMyAssignedExamsAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync("Exam/GetMyAssigned", cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<AssignedExamDto>(raw).Select(MapAssignedExam).ToList();
    }

    public async Task<DesktopExamTaking?> GetExamForTakingAsync(long examId, CancellationToken cancellationToken = default)
    {
        if (examId <= 0) return null;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.GetAsync($"Exam/GetForTaking?examId={examId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<ExamTakingDto>(raw);
        return dto is null || dto.ExamId <= 0 ? null : MapExamTaking(dto);
    }

    public async Task<DesktopStartExamAttemptResult?> StartExamAttemptAsync(long examId, CancellationToken cancellationToken = default)
    {
        if (examId <= 0) return null;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync("Exam/StartAttempt", new { examId }, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ApiJsonHelper.ReadObject<StartExamAttemptDto>(raw);
        if (dto is null || dto.AttemptId <= 0) return null;

        return new DesktopStartExamAttemptResult(dto.AttemptId, dto.ExpiresAtUtc);
    }

    public async Task SaveExamAnswersAsync(
        long attemptId,
        IReadOnlyList<DesktopExamAnswerPayload> answers,
        CancellationToken cancellationToken = default)
    {
        if (attemptId <= 0) return;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Exam/SaveAnswers",
            new
            {
                attemptId,
                answers = answers.Select(a => new
                {
                    questionId = a.QuestionId,
                    selectedOptionIdsJson = a.SelectedOptionIdsJson,
                    textAnswer = a.TextAnswer,
                }),
            },
            cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task SubmitExamAttemptAsync(
        long attemptId,
        IReadOnlyList<DesktopExamAnswerPayload> answers,
        CancellationToken cancellationToken = default)
    {
        if (attemptId <= 0) return;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync(
            "Exam/SubmitAttempt",
            new
            {
                attemptId,
                answers = answers.Select(a => new
                {
                    questionId = a.QuestionId,
                    selectedOptionIdsJson = a.SelectedOptionIdsJson,
                    textAnswer = a.TextAnswer,
                }),
            },
            cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task AbandonExamAttemptAsync(long attemptId, CancellationToken cancellationToken = default)
    {
        if (attemptId <= 0) return;

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        using var response = await _http.PostAsJsonAsync("Exam/AbandonAttempt", new { attemptId }, cancellationToken);
        _ = response;
    }

    public async Task<IReadOnlyList<DesktopTeacherStudentSatisfactionItem>> GetTeacherStudentSatisfactionAsync(
        long courseId = 0,
        long enrollmentId = 0,
        CancellationToken cancellationToken = default)
    {
        if (courseId <= 0 && enrollmentId <= 0) return [];

        await EnsureBaseAddressAsync(cancellationToken);
        await AttachAuthAsync(cancellationToken);

        var url = enrollmentId > 0
            ? $"DesktopDrm/TeacherStudentSatisfaction?enrollmentId={enrollmentId}"
            : $"DesktopDrm/TeacherStudentSatisfaction?courseId={courseId}";

        using var response = await _http.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode) return [];

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        return ApiJsonHelper.ReadList<TeacherStudentSatisfactionDto>(raw)
            .Select(x => new DesktopTeacherStudentSatisfactionItem(
                x.Id,
                x.CourseId,
                x.EnrollmentId,
                x.TeacherUserId,
                x.StudentUserId,
                x.StudentName,
                x.Score,
                x.Note,
                x.UpdatedAtUtc))
            .ToList();
    }

    public async Task<DesktopAboutUsPage?> GetAboutUsPageAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);

        using var response = await _http.GetAsync("AboutUs/Get", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ReadCmsObject<AboutUsDto>(raw);
        if (dto is null || dto.Id <= 0 && string.IsNullOrWhiteSpace(dto.HeroTitle) && string.IsNullOrWhiteSpace(dto.IntroTitle))
            return null;

        var members = (dto.TeamMembers ?? [])
            .OrderBy(m => m.DisplayOrder)
            .Select(m => new DesktopAboutUsTeamMember(
                m.Id,
                m.FullName ?? string.Empty,
                m.SkillTitle ?? string.Empty,
                NullIfWhiteSpace(m.ImageUrl),
                NullIfWhiteSpace(m.GithubUrl),
                NullIfWhiteSpace(m.LinkedinUrl),
                NullIfWhiteSpace(m.TwitterUrl),
                NullIfWhiteSpace(m.InstagramUrl),
                NullIfWhiteSpace(m.WebsiteUrl),
                m.DisplayOrder))
            .ToList();

        return new DesktopAboutUsPage(
            dto.Id,
            dto.HeroTitle ?? string.Empty,
            dto.HeroSubtitle ?? string.Empty,
            dto.IntroTitle ?? string.Empty,
            dto.IntroContentHtml ?? string.Empty,
            dto.MissionTitle ?? string.Empty,
            dto.MissionContentHtml ?? string.Empty,
            dto.VisionTitle ?? string.Empty,
            dto.VisionContentHtml ?? string.Empty,
            dto.ValuesTitle ?? string.Empty,
            dto.ValuesContentHtml ?? string.Empty,
            dto.TeamTitle ?? string.Empty,
            dto.TeamContentHtml ?? string.Empty,
            members);
    }

    public async Task<DesktopContactUsPage?> GetContactUsPageAsync(CancellationToken cancellationToken = default)
    {
        await EnsureBaseAddressAsync(cancellationToken);

        using var response = await _http.GetAsync("ContactUs/Get", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        var dto = ReadCmsObject<ContactUsDto>(raw);
        if (dto is null || dto.Id <= 0
            && string.IsNullOrWhiteSpace(dto.ContactInfoPhone)
            && string.IsNullOrWhiteSpace(dto.HeadquartersAddress))
            return null;

        return new DesktopContactUsPage(
            dto.Id,
            dto.PageTitle ?? string.Empty,
            dto.PageSubtitle ?? string.Empty,
            dto.HeadquartersTitle ?? string.Empty,
            dto.HeadquartersAddress ?? string.Empty,
            dto.HeadquartersPhone ?? string.Empty,
            dto.HeadquartersEmail ?? string.Empty,
            dto.ContactInfoTitle ?? string.Empty,
            dto.ContactInfoPhone ?? string.Empty,
            dto.ContactInfoEmail ?? string.Empty,
            dto.SalesSupportTitle ?? string.Empty,
            dto.SalesSupportPhone ?? string.Empty,
            dto.SalesSupportEmail ?? string.Empty,
            NullIfWhiteSpace(dto.FacebookUrl),
            NullIfWhiteSpace(dto.TwitterUrl),
            NullIfWhiteSpace(dto.InstagramUrl),
            NullIfWhiteSpace(dto.LinkedInUrl));
    }

    private static T? ReadCmsObject<T>(string raw)
    {
        var dto = ApiJsonHelper.ReadObject<T>(raw);
        if (dto is not null) return dto;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var element = doc.RootElement;
            for (var i = 0; i < 3; i++)
            {
                if (element.ValueKind != JsonValueKind.Object) break;
                if ((element.TryGetProperty("queryResult", out var nested) || element.TryGetProperty("QueryResult", out nested)
                     || element.TryGetProperty("data", out nested) || element.TryGetProperty("Data", out nested))
                    && nested.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    element = nested;
                    continue;
                }

                break;
            }

            return JsonSerializer.Deserialize<T>(element.GetRawText(), JsonOptions);
        }
        catch
        {
            return default;
        }
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DesktopWatermarkForPlayback MapWatermark(WatermarkForPlaybackDto dto)
    {
        var policy = dto.Policy ?? new WatermarkPolicyDto();
        var student = dto.Student ?? new WatermarkStudentDto();
        return new DesktopWatermarkForPlayback(
            dto.CourseId,
            new DesktopWatermarkPolicy(
                policy.TextTemplate ?? "{FullName} | {Email}",
                policy.FontSize > 0 ? policy.FontSize : 16,
                string.IsNullOrWhiteSpace(policy.FontColor) ? "#FFFFFF" : policy.FontColor!,
                policy.Opacity is > 0 and <= 1 ? policy.Opacity : 0.55,
                Enum.IsDefined(typeof(DesktopWatermarkPosition), policy.Position)
                    ? (DesktopWatermarkPosition)policy.Position
                    : DesktopWatermarkPosition.BottomRight,
                policy.RotationDeg,
                Enum.IsDefined(typeof(DesktopWatermarkMovement), policy.Movement)
                    ? (DesktopWatermarkMovement)policy.Movement
                    : DesktopWatermarkMovement.None,
                policy.PaddingPx > 0 ? policy.PaddingPx : 16,
                policy.PlatformLogoLocked),
            new DesktopWatermarkStudentFields(student.FullName, student.Email, student.Phone));
    }

    private static DesktopAssignedExam MapAssignedExam(AssignedExamDto dto) =>
        new(
            dto.ExamId,
            dto.AttemptId,
            dto.Title ?? string.Empty,
            dto.CourseTitle ?? string.Empty,
            dto.Level ?? string.Empty,
            dto.EndsAtUtc,
            dto.DurationMinutes,
            dto.TotalPoints,
            dto.AttemptStatus,
            dto.FinalScore,
            dto.ExpiresAtUtc);

    private static DesktopExamTaking MapExamTaking(ExamTakingDto dto) =>
        new(
            dto.ExamId,
            dto.AttemptId,
            dto.Title ?? string.Empty,
            dto.CourseTitle ?? string.Empty,
            dto.DurationMinutes,
            dto.EndsAtUtc,
            dto.ExpiresAtUtc,
            dto.AttemptStatus,
            dto.TotalPoints,
            dto.FinalScore,
            dto.ProfessorFeedback,
            dto.Questions?.Select(q => new DesktopExamTakingQuestion(
                q.Id,
                q.OrderIndex,
                q.QuestionType,
                q.Prompt ?? string.Empty,
                q.CodeSnippet,
                q.CodeLanguage,
                q.Points,
                q.Options?.Select(o => new DesktopExamTakingOption(o.Id, o.Text ?? string.Empty, o.OrderIndex)).ToList() ?? [])).ToList() ?? [],
            dto.Answers?.Select(a => new DesktopExamTakingAnswer(
                a.QuestionId,
                a.SelectedOptionIdsJson,
                a.TextAnswer)).ToList() ?? []);

    private static DesktopTeacherSearchItem MapTeacherSearchItem(TeacherSearchDto dto) =>
        new(
            dto.TeacherId,
            dto.UserId,
            dto.DisplayName ?? string.Empty,
            dto.UserName ?? string.Empty,
            dto.Email,
            dto.AccountStatus,
            dto.IsUserBlocked,
            dto.ProfileApprovalStatus,
            dto.PublishedCourseCount);

    private static DesktopEnrolledStudent MapEnrolledStudent(EnrolledStudentDto dto) =>
        new(
            dto.StudentId,
            dto.UserId,
            dto.FullName ?? string.Empty,
            dto.UserName,
            dto.Email,
            dto.CourseId,
            dto.CourseTitle ?? string.Empty,
            dto.EnrollmentDateTime ?? string.Empty,
            dto.IsActive);

    private static DesktopStudentDesktopLicense MapStudentDesktopLicense(StudentDesktopLicenseDto dto) =>
        new(
            dto.EnrollmentId,
            dto.UserId,
            dto.StudentId,
            dto.CourseId,
            dto.CourseTitle ?? string.Empty,
            dto.DesktopLicenseKey,
            dto.IsDesktopLicenseActive,
            dto.DesktopLicenseExpiresAtUtc,
            dto.IsCurrentlyValid,
            dto.EnrollmentDateTime ?? string.Empty);

    private static async Task<DesktopLicenseOperationResult> ReadLicenseOperationResultAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadErrorMessage(raw) ?? "عملیات لایسنس ناموفق بود.";
            return new DesktopLicenseOperationResult(false, message, null);
        }

        var payload = ApiJsonHelper.ReadObject<StudentDesktopLicenseResultDto>(raw);
        if (payload is null || payload.EnrollmentId <= 0)
            return new DesktopLicenseOperationResult(false, "پاسخ لایسنس نامعتبر است.", null);

        return new DesktopLicenseOperationResult(
            true,
            null,
            new DesktopStudentDesktopLicense(
                payload.EnrollmentId,
                0,
                0,
                payload.CourseId,
                payload.CourseTitle ?? string.Empty,
                payload.DesktopLicenseKey,
                payload.IsDesktopLicenseActive,
                payload.DesktopLicenseExpiresAtUtc,
                payload.IsCurrentlyValid,
                string.Empty));
    }

    private static DesktopRemoteAssistSession MapRemoteAssist(RemoteAssistSessionDto dto) =>
        new(
            dto.SessionId,
            dto.RequesterUserId,
            dto.AcceptedByTeacherUserId,
            dto.OneTimeSessionCode ?? string.Empty,
            dto.SessionUsername ?? string.Empty,
            dto.SessionPassword,
            dto.Status ?? "Pending",
            dto.CreatedAtUtc,
            dto.CodeExpiresAtUtc,
            dto.AcceptedAtUtc,
            dto.EndedAtUtc,
            dto.ConsentRequestedAtUtc,
            dto.AllowRemoteControl,
            dto.AllowClipboard,
            dto.AllowFileTransfer,
            dto.AllowAudio,
            dto.AllowLockLocalInput,
            dto.RequesterDisplayName,
            dto.RequesterPhoneNumber,
            dto.HelperDisplayName);

    private async Task AttachAuthAsync(CancellationToken cancellationToken)
    {
        var token = await _sessionStore.GetAccessTokenAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            _http.DefaultRequestHeaders.Authorization = null;
            return;
        }

        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private Uri ResolveMediaUrl(string encryptedFileUrl)
    {
        var decoded = WebUtility.HtmlDecode(encryptedFileUrl).Trim();

        if (Uri.TryCreate(decoded, UriKind.Absolute, out var absolute))
            return absolute;

        var authority = _http.BaseAddress!.GetLeftPart(UriPartial.Authority);
        return new Uri(authority + decoded);
    }

    private async Task EnsureBaseAddressAsync(CancellationToken cancellationToken)
    {
        await _settings.EnsureInitializedAsync(cancellationToken);
        var target = new Uri(_settings.ApiBaseUrl.TrimEnd('/') + "/");
        if (_http.BaseAddress != target)
            _http.BaseAddress = target;
    }

    private static LoginUserData? ExtractUserData(JsonElement data)
    {
        if (data.ValueKind != JsonValueKind.Object) return null;

        if (data.TryGetProperty("userData", out var nested) || data.TryGetProperty("UserData", out nested))
            return JsonSerializer.Deserialize<LoginUserData>(nested.GetRawText(), JsonOptions);

        return JsonSerializer.Deserialize<LoginUserData>(data.GetRawText(), JsonOptions);
    }

    private static JsonElement UnwrapApiPayload(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object) return root;
        if (root.TryGetProperty("data", out var data) || root.TryGetProperty("Data", out data))
        {
            if (data.ValueKind == JsonValueKind.Object)
                return data;
        }
        return root;
    }

    private static DateTime? TryReadJwtExpiryUtc(string jwt)
    {
        if (string.IsNullOrWhiteSpace(jwt)) return null;
        var parts = jwt.Split('.');
        if (parts.Length < 2) return null;
        try
        {
            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            switch (payload.Length % 4)
            {
                case 2: payload += "=="; break;
                case 3: payload += "="; break;
            }

            var json = Encoding.UTF8.GetString(Convert.FromBase64String(payload));
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("exp", out var exp) && exp.TryGetInt64(out var seconds))
                return DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
        }
        catch
        {
            // ignore malformed tokens
        }

        return null;
    }

    private static string? TryReadErrorMessage(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                return root[0].GetString();
            if (root.ValueKind == JsonValueKind.String)
                return root.GetString();
            if (root.ValueKind == JsonValueKind.Object)
            {
                if (root.TryGetProperty("message", out var m)) return m.GetString();
                if (root.TryGetProperty("Message", out m)) return m.GetString();
            }
        }
        catch
        {
            // ignore parse failures
        }

        return raw.Length > 200 ? raw[..200] : raw;
    }

    private static long TryReadCreatedId(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return 0;
        if (long.TryParse(raw.Trim('"'), out var direct) && direct > 0) return direct;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            if (root.ValueKind == JsonValueKind.Number && root.TryGetInt64(out direct) && direct > 0)
                return direct;

            foreach (var key in new[] { "data", "Data", "id", "Id" })
            {
                if (!root.TryGetProperty(key, out var value)) continue;
                if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out direct) && direct > 0)
                    return direct;
                if (value.ValueKind == JsonValueKind.Object)
                {
                    foreach (var nestedKey in new[] { "id", "Id", "queryResult", "QueryResult" })
                    {
                        if (value.TryGetProperty(nestedKey, out var nested)
                            && nested.ValueKind == JsonValueKind.Number
                            && nested.TryGetInt64(out direct)
                            && direct > 0)
                            return direct;
                    }
                }
            }
        }
        catch
        {
            // ignore parse failures
        }

        return 0;
    }

    private static DesktopStoryMediaKind ParseStoryMediaKind(int mediaKind) =>
        Enum.IsDefined(typeof(DesktopStoryMediaKind), mediaKind)
            ? (DesktopStoryMediaKind)mediaKind
            : DesktopStoryMediaKind.None;

    private static string GuessStoryMimeType(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".m4v" => "video/x-m4v",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/jpeg",
        };
    }

    private static string GuessChatMimeType(string filePath, DesktopChatMediaKind mediaKind)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".m4v" => "video/x-m4v",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            ".aac" => "audio/aac",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".pdf" => "application/pdf",
            ".zip" => "application/zip",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => mediaKind switch
            {
                DesktopChatMediaKind.Audio => "audio/mpeg",
                DesktopChatMediaKind.Video => "video/mp4",
                DesktopChatMediaKind.File => "application/octet-stream",
                _ => "image/jpeg",
            },
        };
    }

    private static DesktopAccessStatus MapAccess(DesktopAccessDto? dto)
    {
        if (dto is null)
            return new DesktopAccessStatus(true, null, false, false, null);

        return new DesktopAccessStatus(
            dto.IsAllowed,
            dto.BlockReason,
            dto.IsDeviceBlocked,
            dto.IsUserBlocked,
            dto.BlockScope);
    }

    private sealed class DesktopAccessDto
    {
        public bool IsAllowed { get; set; } = true;
        public bool IsDeviceBlocked { get; set; }
        public bool IsUserBlocked { get; set; }
        public string? BlockReason { get; set; }
        public string? BlockScope { get; set; }
    }

    private sealed class LoginUserData
    {
        public string? Token { get; set; }
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? FullName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? AvatarUrl { get; set; }
    }

    private sealed class DesktopUpdateDto
    {
        public bool UpdateAvailable { get; set; }
        public bool IsMandatory { get; set; }
        public string? LatestVersion { get; set; }
        public string? InstallerUrl { get; set; }
        public string? ReleaseNotes { get; set; }
        public string? MinSupportedVersion { get; set; }
    }

    private sealed class DesktopEncryptedMediaDto
    {
        public long MediaAssetId { get; set; }
        public string? Title { get; set; }
        public string? OriginalFileName { get; set; }
        public string? MimeType { get; set; }
        public long FileSizeBytes { get; set; }
        public string? EncryptedFileUrl { get; set; }
        public long? CourseId { get; set; }
        public string? CourseTitle { get; set; }
    }

    private sealed class DesktopLicenseValidationDto
    {
        public long EnrollmentId { get; set; }
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public string? LicenseKey { get; set; }
    }

    private sealed class DesktopLicensedCourseDto
    {
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public string? DesktopLicenseKey { get; set; }
        public bool IsActive { get; set; }
        public long TeacherId { get; set; }
        public string? TeacherName { get; set; }
    }

    private sealed class DesktopCourseCurriculumDto
    {
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public List<DesktopCourseSectionDto>? Sections { get; set; }
    }

    private sealed class DesktopCourseSectionDto
    {
        public long SectionId { get; set; }
        public string? Title { get; set; }
        public bool HasMaterials { get; set; }
        public List<DesktopCourseCurriculumMaterialDtoContract>? Materials { get; set; }
        public List<DesktopCourseLessonDto>? Lessons { get; set; }
    }

    private sealed class DesktopCourseLessonDto
    {
        public long LessonId { get; set; }
        public string? Title { get; set; }
        public string? VideoTitle { get; set; }
        public int DurationSeconds { get; set; }
        public bool IsPublished { get; set; }
        public long? MediaAssetId { get; set; }
        public bool HasEncryptedVideo { get; set; }
        public bool IsLocked { get; set; }
        public bool HasMaterials { get; set; }
        public List<DesktopCourseCurriculumMaterialDtoContract>? Materials { get; set; }
    }

    private sealed class DesktopCourseCurriculumMaterialDtoContract
    {
        public long MaterialId { get; set; }
        public long MediaAssetId { get; set; }
        public string? DisplayName { get; set; }
        public string? OriginalFileName { get; set; }
        public long? FileSizeBytes { get; set; }
        public bool IsEncrypted { get; set; }
    }

    private sealed class OfflineGrantDto
    {
        public string? GrantToken { get; set; }
        public long CourseId { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }

    private sealed class DesktopPlaybackDto
    {
        public long MediaAssetId { get; set; }
        public string? Title { get; set; }
        public string? MimeType { get; set; }
        public string? EncryptedFileUrl { get; set; }
        public string? EncryptionAlgorithm { get; set; }
        public string? IvBase64 { get; set; }
        public string? WrappedContentKeyBase64 { get; set; }
        public string? ContentChecksumSha256 { get; set; }
        public DateTime GrantExpiresAtUtc { get; set; }
    }

    private sealed class SupportConversationDto
    {
        public long Id { get; set; }
        public string? Subject { get; set; }
        public long StudentUserId { get; set; }
        public long TeacherUserId { get; set; }
        public string? OtherParticipantName { get; set; }
        public string? LastMessagePreview { get; set; }
        public DateTime? LastMessageAtUtc { get; set; }
        public int UnreadCount { get; set; }
    }

    private sealed class SupportTeacherOptionDto
    {
        public long TeacherUserId { get; set; }
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? Source { get; set; }
    }

    private sealed class ChatUploadDto
    {
        public string? Url { get; set; }
    }

    private sealed class SupportConversationDetailDto
    {
        public long Id { get; set; }
        public long StudentUserId { get; set; }
        public long TeacherUserId { get; set; }
        public string? Subject { get; set; }
        public string? Status { get; set; }
        public bool HasMoreOlderMessages { get; set; }
        public List<SupportMessageDto>? Messages { get; set; }
    }

    private sealed class SupportMessageDto
    {
        public long Id { get; set; }
        public long SenderUserId { get; set; }
        public string? SenderName { get; set; }
        public string? ContentHtml { get; set; }
        public DateTime SentAtUtc { get; set; }
        public bool IsMine { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? EditedAtUtc { get; set; }
        public long? ReplyToMessageId { get; set; }
        public string? ReplyToSenderName { get; set; }
        public string? ReplyToContentPreview { get; set; }
    }

    private sealed class TeacherStoryDto
    {
        public long Id { get; set; }
        public long TeacherUserId { get; set; }
        public string? TeacherName { get; set; }
        public string? TeacherAvatarUrl { get; set; }
        public string? Caption { get; set; }
        public string? MediaUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int MediaKind { get; set; }
        public int DurationSeconds { get; set; }
        public bool HasUnseen { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }

    private sealed class StoryUploadDto
    {
        public string? Url { get; set; }
        public int MediaKind { get; set; }
    }

    private sealed class PresenceDto
    {
        public bool IsOnline { get; set; }
    }

    private sealed class VipStatusDto
    {
        public bool HasActiveAccess { get; set; }
    }

    private sealed class WebHandoffDto
    {
        public string? Code { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
    }

    private sealed class RemoteAssistSessionDto
    {
        public long SessionId { get; set; }
        public long RequesterUserId { get; set; }
        public long? AcceptedByTeacherUserId { get; set; }
        public string? OneTimeSessionCode { get; set; }
        public string? SessionUsername { get; set; }
        public string? SessionPassword { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime CodeExpiresAtUtc { get; set; }
        public DateTime? AcceptedAtUtc { get; set; }
        public DateTime? EndedAtUtc { get; set; }
        public DateTime? ConsentRequestedAtUtc { get; set; }
        public bool AllowRemoteControl { get; set; } = true;
        public bool AllowClipboard { get; set; }
        public bool AllowFileTransfer { get; set; }
        public bool AllowAudio { get; set; }
        public bool AllowLockLocalInput { get; set; }
        public string? RequesterDisplayName { get; set; }
        public string? RequesterPhoneNumber { get; set; }
        public string? HelperDisplayName { get; set; }
    }

    private sealed class RemoteAssistHistoryDto
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<RemoteAssistSessionDto>? Items { get; set; }
    }

    private sealed class RemoteAssistAcceptedDto
    {
        public long SessionId { get; set; }
        public long RequesterUserId { get; set; }
        public long AcceptedByTeacherUserId { get; set; }
        public string? Status { get; set; }
        public DateTime AcceptedAtUtc { get; set; }
    }

    private sealed class TeacherSearchDto
    {
        public long TeacherId { get; set; }
        public long UserId { get; set; }
        public string? DisplayName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? AccountStatus { get; set; }
        public bool IsUserBlocked { get; set; }
        public string? ProfileApprovalStatus { get; set; }
        public int PublishedCourseCount { get; set; }
    }

    private sealed class DesktopOnlineUserDto
    {
        public long UserId { get; set; }
        public string? DisplayName { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public string? AppVersion { get; set; }
        public string? DeviceId { get; set; }
        public DateTime LastSeenAtUtc { get; set; }
    }

    private sealed class TeacherCourseDto
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public string? Status { get; set; }
        public int StudentCount { get; set; }
        public decimal? Price { get; set; }
        public string? CategoryName { get; set; }
    }

    private sealed class EnrolledStudentDto
    {
        public long StudentId { get; set; }
        public long UserId { get; set; }
        public string? FullName { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public string? EnrollmentDateTime { get; set; }
        public bool IsActive { get; set; }
    }

    private sealed class ApproveEnrollmentDto
    {
        public long EnrollmentId { get; set; }
        public string? SpotPlayerLicense { get; set; }
        public string? CourseTitle { get; set; }
    }

    private sealed class StudentDesktopLicenseDto
    {
        public long EnrollmentId { get; set; }
        public long UserId { get; set; }
        public long StudentId { get; set; }
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public string? DesktopLicenseKey { get; set; }
        public bool IsDesktopLicenseActive { get; set; }
        public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
        public bool IsCurrentlyValid { get; set; }
        public string? EnrollmentDateTime { get; set; }
    }

    private sealed class StudentDesktopLicenseResultDto
    {
        public long EnrollmentId { get; set; }
        public long CourseId { get; set; }
        public string? CourseTitle { get; set; }
        public string? DesktopLicenseKey { get; set; }
        public bool IsDesktopLicenseActive { get; set; }
        public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
        public bool IsCurrentlyValid { get; set; }
    }

    private sealed class WatermarkForPlaybackDto
    {
        public long CourseId { get; set; }
        public WatermarkPolicyDto? Policy { get; set; }
        public WatermarkStudentDto? Student { get; set; }
    }

    private sealed class WatermarkPolicyDto
    {
        public string? TextTemplate { get; set; }
        public int FontSize { get; set; }
        public string? FontColor { get; set; }
        public double Opacity { get; set; }
        public byte Position { get; set; }
        public double RotationDeg { get; set; }
        public byte Movement { get; set; }
        public int PaddingPx { get; set; }
        public bool PlatformLogoLocked { get; set; }
    }

    private sealed class WatermarkStudentDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
    }

    private sealed class AssignedExamDto
    {
        public long ExamId { get; set; }
        public long? AttemptId { get; set; }
        public string? Title { get; set; }
        public string? CourseTitle { get; set; }
        public string? Level { get; set; }
        public DateTime EndsAtUtc { get; set; }
        public int DurationMinutes { get; set; }
        public decimal TotalPoints { get; set; }
        public byte AttemptStatus { get; set; }
        public decimal? FinalScore { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
    }

    private sealed class ExamTakingDto
    {
        public long ExamId { get; set; }
        public long AttemptId { get; set; }
        public string? Title { get; set; }
        public string? CourseTitle { get; set; }
        public int DurationMinutes { get; set; }
        public DateTime EndsAtUtc { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
        public byte AttemptStatus { get; set; }
        public decimal TotalPoints { get; set; }
        public decimal? FinalScore { get; set; }
        public string? ProfessorFeedback { get; set; }
        public List<ExamTakingQuestionDto>? Questions { get; set; }
        public List<ExamTakingAnswerDto>? Answers { get; set; }
    }

    private sealed class ExamTakingQuestionDto
    {
        public long Id { get; set; }
        public int OrderIndex { get; set; }
        public byte QuestionType { get; set; }
        public string? Prompt { get; set; }
        public string? CodeSnippet { get; set; }
        public string? CodeLanguage { get; set; }
        public decimal Points { get; set; }
        public List<ExamTakingOptionDto>? Options { get; set; }
    }

    private sealed class ExamTakingOptionDto
    {
        public long Id { get; set; }
        public string? Text { get; set; }
        public int OrderIndex { get; set; }
    }

    private sealed class ExamTakingAnswerDto
    {
        public long QuestionId { get; set; }
        public string? SelectedOptionIdsJson { get; set; }
        public string? TextAnswer { get; set; }
    }

    private sealed class StartExamAttemptDto
    {
        public long AttemptId { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }

    private sealed class TeacherStudentSatisfactionDto
    {
        public long Id { get; set; }
        public long CourseId { get; set; }
        public long EnrollmentId { get; set; }
        public long TeacherUserId { get; set; }
        public long StudentUserId { get; set; }
        public string? StudentName { get; set; }
        public byte Score { get; set; }
        public string? Note { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }

    private sealed class AboutUsDto
    {
        public long Id { get; set; }
        public string? HeroTitle { get; set; }
        public string? HeroSubtitle { get; set; }
        public string? IntroTitle { get; set; }
        public string? IntroContentHtml { get; set; }
        public string? MissionTitle { get; set; }
        public string? MissionContentHtml { get; set; }
        public string? VisionTitle { get; set; }
        public string? VisionContentHtml { get; set; }
        public string? ValuesTitle { get; set; }
        public string? ValuesContentHtml { get; set; }
        public string? TeamTitle { get; set; }
        public string? TeamContentHtml { get; set; }
        public List<AboutUsTeamMemberDto>? TeamMembers { get; set; }
    }

    private sealed class AboutUsTeamMemberDto
    {
        public long Id { get; set; }
        public string? FullName { get; set; }
        public string? SkillTitle { get; set; }
        public string? ImageUrl { get; set; }
        public string? GithubUrl { get; set; }
        public string? LinkedinUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public int DisplayOrder { get; set; }
    }

    private sealed class ContactUsDto
    {
        public long Id { get; set; }
        public string? PageTitle { get; set; }
        public string? PageSubtitle { get; set; }
        public string? HeadquartersTitle { get; set; }
        public string? HeadquartersAddress { get; set; }
        public string? HeadquartersPhone { get; set; }
        public string? HeadquartersEmail { get; set; }
        public string? ContactInfoTitle { get; set; }
        public string? ContactInfoPhone { get; set; }
        public string? ContactInfoEmail { get; set; }
        public string? SalesSupportTitle { get; set; }
        public string? SalesSupportPhone { get; set; }
        public string? SalesSupportEmail { get; set; }
        public string? FacebookUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? LinkedInUrl { get; set; }
    }
}
