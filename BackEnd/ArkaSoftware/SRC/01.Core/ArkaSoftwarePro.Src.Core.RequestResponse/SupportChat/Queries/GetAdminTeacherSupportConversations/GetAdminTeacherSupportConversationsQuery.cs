using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminTeacherSupportConversations;

public class GetAdminTeacherSupportConversationsQuery : IQuery<List<AdminSupportConversationListQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public string Path => "/api/Service/SupportChatAdmin/GetTeacherConversations";
}

public class AdminSupportConversationListQri
{
    public long Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long StudentUserId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public string? LastMessagePreview { get; set; }
}
