using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetPendingRemoteAssistSessions;

public class GetPendingRemoteAssistSessionsQuery : IQuery<List<RemoteAssistSessionQri>>
{
    public long TeacherUserId { get; set; }
}
