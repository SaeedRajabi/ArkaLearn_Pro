using ArkaSoftwarePro.Src.Core.Contracts.Auth;
using Microsoft.Extensions.Caching.Memory;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Authentication;

public sealed class LoginPuzzleCaptchaService(IMemoryCache cache) : ILoginPuzzleCaptchaService
{
    private const string CachePrefix = "login-puzzle:";
    private const int Tolerance = 4;
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    private sealed record PuzzleEntry(string? IpAddress, int TargetPercent);

    public LoginPuzzleChallenge CreateChallenge(string? ipAddress)
    {
        var target = Random.Shared.Next(18, 86);
        var captchaId = Guid.NewGuid().ToString("N");
        cache.Set(
            $"{CachePrefix}{captchaId}",
            new PuzzleEntry(NormalizeIp(ipAddress), target),
            Ttl);

        return new LoginPuzzleChallenge
        {
            CaptchaId = captchaId,
            TargetPercent = target,
            TolerancePercent = Tolerance,
        };
    }

    public bool TryValidate(string? captchaId, int? slidePercent, string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(captchaId) || slidePercent is null)
            return false;

        var key = $"{CachePrefix}{captchaId.Trim()}";
        if (!cache.TryGetValue(key, out PuzzleEntry? entry) || entry is null)
            return false;

        var ip = NormalizeIp(ipAddress);
        if (!string.IsNullOrEmpty(entry.IpAddress)
            && !string.IsNullOrEmpty(ip)
            && !string.Equals(entry.IpAddress, ip, StringComparison.Ordinal))
        {
            return false;
        }

        var ok = Math.Abs(entry.TargetPercent - slidePercent.Value) <= Tolerance;
        if (ok)
            cache.Remove(key);
        return ok;
    }

    public bool IsSuspicious(
        string? ipAddress,
        string? userAgent,
        int failedAttemptCount,
        bool captchaAlreadyPassed)
    {
        if (captchaAlreadyPassed)
            return false;

        if (failedAttemptCount >= 2)
            return true;

        var ua = (userAgent ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(ua))
            return true;

        var lower = ua.ToLowerInvariant();
        if (lower.Contains("bot")
            || lower.Contains("crawler")
            || lower.Contains("spider")
            || lower.Contains("curl/")
            || lower.Contains("wget/")
            || lower.Contains("python-requests")
            || lower.Contains("httpclient")
            || lower.Contains("scrapy")
            || lower == "okhttp")
        {
            return true;
        }

        // Extremely short / non-browser agents are treated as suspicious.
        if (ua.Length < 12)
            return true;

        return false;
    }

    private static string? NormalizeIp(string? ip)
        => string.IsNullOrWhiteSpace(ip) ? null : ip.Trim();
}
