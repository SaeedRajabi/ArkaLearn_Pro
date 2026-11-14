using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetMyRemoteAssistSession;

public class GetMyRemoteAssistSessionQuery : IQuery<RemoteAssistSessionQri?>
{
    public long UserId { get; set; }
}
