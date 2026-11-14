using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.DeleteRemoteAssistHistory;

public class DeleteRemoteAssistHistoryCommand : ICommand<string>
{
    public long ActorUserId { get; set; }
    public bool ActorIsAdmin { get; set; }
    public bool ActorIsTeacher { get; set; }

    /// <summary>When set, only this session is removed.</summary>
    public long? SessionId { get; set; }

    /// <summary>Optional filters for clear-all (admin).</summary>
    public long? StudentUserId { get; set; }
    public long? TeacherUserId { get; set; }
}
