using Framework.Src.Core.RequestResponse.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.AcceptRemoteAssistSession;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ReconnectRemoteAssistSession;

/// <summary>
/// Teacher reconnects to a student's open remote-assist session and re-requests consent.
/// </summary>
public class ReconnectRemoteAssistSessionCommand : ICommand<RemoteAssistSessionAcceptedQri>
{
    public long HelperUserId { get; set; }
    public long StudentUserId { get; set; }
    public bool ActorIsAdmin { get; set; }
}
