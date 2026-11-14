using Framework.Src.Core.RequestResponse.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.ChangeRemoteAssistPassword;

public class ChangeRemoteAssistPasswordCommand : ICommand<RemoteAssistSessionQri>
{
    public long UserId { get; set; }
    public long SessionId { get; set; }
    /// <summary>Optional custom password; empty = server generates.</summary>
    public string? NewPassword { get; set; }
}
