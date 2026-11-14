namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;

public enum LoginAttemptResult
{
    Recorded = 0,
    TemporarilyBlocked = 1,
    PermanentlyBlocked = 2
}

public interface IRateLimiterService
{
    bool IsBlocked(string key);
    LoginAttemptResult RegisterFailedAttempt(string key);
    void Clear(string key);
    /// <summary>Current failed-attempt count for the key (0 if unknown).</summary>
    int GetFailedAttemptCount(string key);
}
