using Framework.Src.Core.RequestResponse.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.AcceptRemoteAssistSession;

/// <summary>
/// Helper (teacher/admin) enters credentials. Does not activate until student grants consent.
/// </summary>
public class AcceptRemoteAssistSessionCommand : ICommand<RemoteAssistSessionAcceptedQri>
{
    public long HelperUserId { get; set; }

    /// <summary>Legacy alias.</summary>
    public long TeacherUserId
    {
        get => HelperUserId;
        set => HelperUserId = value;
    }

    public string OneTimeSessionCode { get; set; } = string.Empty;
    public string SessionUsername { get; set; } = string.Empty;
    public string SessionPassword { get; set; } = string.Empty;
    public bool ActorIsAdmin { get; set; }
}

public class RemoteAssistSessionAcceptedQri
{
    public long SessionId { get; set; }
    public long RequesterUserId { get; set; }
    public long AcceptedByTeacherUserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime AcceptedAtUtc { get; set; }
    public DateTime? ConsentRequestedAtUtc { get; set; }
    public RemoteAssistSessionQri? Session { get; set; }
}
