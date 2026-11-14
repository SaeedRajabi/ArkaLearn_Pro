using Framework.Src.Core.RequestResponse.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ConfirmRemoteAssistConsent;

public class ConfirmRemoteAssistConsentCommand : ICommand<RemoteAssistSessionQri>
{
    public long OwnerUserId { get; set; }
    public long SessionId { get; set; }
    public bool AllowRemoteControl { get; set; } = true;
    public bool AllowClipboard { get; set; }
    public bool AllowFileTransfer { get; set; }
    public bool AllowAudio { get; set; }
    public bool AllowLockLocalInput { get; set; }
}

public class DenyRemoteAssistConsentCommand : ICommand<RemoteAssistSessionQri>
{
    public long OwnerUserId { get; set; }
    public long SessionId { get; set; }
}
