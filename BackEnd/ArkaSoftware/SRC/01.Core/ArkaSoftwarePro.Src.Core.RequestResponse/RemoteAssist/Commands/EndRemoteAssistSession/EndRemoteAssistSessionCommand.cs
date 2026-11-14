using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.EndRemoteAssistSession;

public class EndRemoteAssistSessionCommand : ICommand<string>
{
    public long UserId { get; set; }
    public long SessionId { get; set; }
}
