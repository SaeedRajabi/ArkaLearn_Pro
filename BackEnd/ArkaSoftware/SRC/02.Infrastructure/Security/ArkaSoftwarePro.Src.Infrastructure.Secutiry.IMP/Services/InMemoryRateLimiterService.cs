using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services;

public sealed class InMemoryRateLimiterService(ISecuritySettingsProvider securitySettingsProvider) : IRateLimiterService
{
    private readonly object _sync = new();
    private readonly Dictionary<string, Entry> _rateLimits = new();

    private sealed class Entry
    {
        public int Attempts { get; set; }
        public int LockoutRounds { get; set; }
        public DateTime LastAttemptUtc { get; set; }
        public DateTime BlockUntilUtc { get; set; }
    }

    public bool IsBlocked(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return false;

        lock (_sync)
        {
            if (!_rateLimits.TryGetValue(key, out var entry))
                return false;

            if (entry.LastAttemptUtc.Date < DateTime.UtcNow.Date)
            {
                entry.Attempts = 0;
                entry.LockoutRounds = 0;
                entry.BlockUntilUtc = DateTime.MinValue;
            }

            return entry.BlockUntilUtc > DateTime.UtcNow;
        }
    }

    public int GetFailedAttemptCount(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return 0;

        lock (_sync)
        {
            if (!_rateLimits.TryGetValue(key, out var entry))
                return 0;

            if (entry.LastAttemptUtc.Date < DateTime.UtcNow.Date)
                return 0;

            return entry.Attempts;
        }
    }

    public LoginAttemptResult RegisterFailedAttempt(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return LoginAttemptResult.Recorded;

        var settings = securitySettingsProvider.GetCurrentAsync().GetAwaiter().GetResult();
        var maxAttempts = settings.MaxLoginAttempts;
        var lockoutMinutes = settings.LockoutMinutes;
        var permanentAfter = settings.PermanentBlockAfterLockouts;

        lock (_sync)
        {
            if (!_rateLimits.TryGetValue(key, out var entry))
            {
                entry = new Entry();
                _rateLimits[key] = entry;
            }

            if (entry.LastAttemptUtc.Date < DateTime.UtcNow.Date)
            {
                entry.Attempts = 0;
                entry.LockoutRounds = 0;
                entry.BlockUntilUtc = DateTime.MinValue;
            }

            entry.Attempts++;
            entry.LastAttemptUtc = DateTime.UtcNow;

            if (entry.Attempts < maxAttempts)
                return LoginAttemptResult.Recorded;

            entry.Attempts = 0;
            entry.LockoutRounds++;
            entry.BlockUntilUtc = DateTime.UtcNow.AddMinutes(lockoutMinutes);

            if (entry.LockoutRounds >= permanentAfter)
                return LoginAttemptResult.PermanentlyBlocked;

            return LoginAttemptResult.TemporarilyBlocked;
        }
    }

    public void Clear(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return;

        lock (_sync)
            _rateLimits.Remove(key);
    }
}
