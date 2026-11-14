using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Queries.GetRemoteAssistHistory;

public class GetRemoteAssistHistoryQuery : IQuery<RemoteAssistHistoryPageQri>
{
    public long ActorUserId { get; set; }
    public bool ActorIsAdmin { get; set; }
    public bool ActorIsTeacher { get; set; }

    /// <summary>Admin filter: sessions owned by this student.</summary>
    public long? StudentUserId { get; set; }

    /// <summary>Admin/teacher filter: sessions accepted by this helper.</summary>
    public long? TeacherUserId { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
