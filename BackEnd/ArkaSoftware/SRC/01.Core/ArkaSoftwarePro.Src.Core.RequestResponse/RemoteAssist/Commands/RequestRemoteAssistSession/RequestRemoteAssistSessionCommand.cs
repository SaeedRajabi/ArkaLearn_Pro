using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;

public class RequestRemoteAssistSessionCommand : ICommand<RemoteAssistSessionQri>
{
    public long UserId { get; set; }
}

public class RemoteAssistSessionQri
{
    public long SessionId { get; set; }
    public long RequesterUserId { get; set; }
    public long? AcceptedByTeacherUserId { get; set; }
    public string OneTimeSessionCode { get; set; } = string.Empty;
    public string SessionUsername { get; set; } = string.Empty;
    public string? SessionPassword { get; set; }
    public string Status { get; set; } = string.Empty;
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
    /// <summary>Whether the requester desktop agent is currently online.</summary>
    public bool IsRequesterOnline { get; set; }
}

public class RemoteAssistHistoryPageQri
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public List<RemoteAssistSessionQri> Items { get; set; } = [];
}
