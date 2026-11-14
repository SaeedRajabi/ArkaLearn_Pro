namespace ArkaSoftwarePro.Src.Core.Contracts.Auth;

public sealed class LoginPuzzleChallenge
{
    public string CaptchaId { get; init; } = string.Empty;
    /// <summary>Target slide position 0–100 (also returned so the client can render a matching notch).</summary>
    public int TargetPercent { get; init; }
    public int TolerancePercent { get; init; } = 4;
}

public interface ILoginPuzzleCaptchaService
{
    LoginPuzzleChallenge CreateChallenge(string? ipAddress);
    bool TryValidate(string? captchaId, int? slidePercent, string? ipAddress);
    bool IsSuspicious(
        string? ipAddress,
        string? userAgent,
        int failedAttemptCount,
        bool captchaAlreadyPassed);
}
