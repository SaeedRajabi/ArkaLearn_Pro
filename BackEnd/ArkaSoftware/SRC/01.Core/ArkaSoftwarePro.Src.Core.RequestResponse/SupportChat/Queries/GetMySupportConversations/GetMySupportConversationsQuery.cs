using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportConversations;

public class GetMySupportConversationsQuery : IQuery<List<SupportConversationListQri>>, IWebRequest
{
    public long UserId { get; set; }
    public long? StudentUserId { get; set; }
    public string Path => "/api/Service/SupportChat/GetMyConversations";
}

public class SupportConversationListQri
{
    public long Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long StudentUserId { get; set; }
    public long TeacherUserId { get; set; }
    public string OtherParticipantName { get; set; } = string.Empty;
    public string? OtherParticipantEmail { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public int UnreadCount { get; set; }
    public string? LastMessagePreview { get; set; }
}
