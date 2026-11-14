using Microsoft.Extensions.Caching.Memory;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class ManualBumpCaptchaService(IMemoryCache cache)
{
    private const string CachePrefix = "manual-bump-captcha:";
    private static readonly char[] CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();

    private sealed record CaptchaEntry(long UserId, string Code);

    public (string CaptchaId, string DisplayCode) Generate(long userId)
    {
        var code = GenerateCode();
        var captchaId = Guid.NewGuid().ToString("N");
        cache.Set(
            $"{CachePrefix}{captchaId}",
            new CaptchaEntry(userId, code),
            TimeSpan.FromMinutes(5));

        return (captchaId, code);
    }

    public bool TryValidate(string captchaId, string captchaCode, long userId)
    {
        if (string.IsNullOrWhiteSpace(captchaId) || string.IsNullOrWhiteSpace(captchaCode))
            return false;

        var key = $"{CachePrefix}{captchaId.Trim()}";
        if (!cache.TryGetValue(key, out CaptchaEntry? entry) || entry is null)
            return false;

        if (entry.UserId != userId)
            return false;

        if (!string.Equals(entry.Code, captchaCode.Trim(), StringComparison.OrdinalIgnoreCase))
            return false;

        cache.Remove(key);
        return true;
    }

    private static string GenerateCode()
    {
        Span<char> buffer = stackalloc char[6];
        for (var i = 0; i < buffer.Length; i++)
            buffer[i] = CodeChars[Random.Shared.Next(CodeChars.Length)];

        return new string(buffer);
    }
}
