namespace ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;

public sealed class RemoteAssistSessionChangedEvent
{
    public long SessionId { get; init; }
    public long RequesterUserId { get; init; }
    public long? AcceptedByTeacherUserId { get; init; }
    public string OneTimeSessionCode { get; init; } = string.Empty;
    public string SessionUsername { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string CreatedAtUtc { get; init; } = string.Empty;
    public string CodeExpiresAtUtc { get; init; } = string.Empty;
    public string? AcceptedAtUtc { get; init; }
    public string? EndedAtUtc { get; init; }
    public string? ConsentRequestedAtUtc { get; init; }
    public string ChangeType { get; init; } = string.Empty;
    public bool AllowRemoteControl { get; init; }
    public bool AllowClipboard { get; init; }
    public bool AllowFileTransfer { get; init; }
    public bool AllowAudio { get; init; }
    public bool AllowLockLocalInput { get; init; }
}
