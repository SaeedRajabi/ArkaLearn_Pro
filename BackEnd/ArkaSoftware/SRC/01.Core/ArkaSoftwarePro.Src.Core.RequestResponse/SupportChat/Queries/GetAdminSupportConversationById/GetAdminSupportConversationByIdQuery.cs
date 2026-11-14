using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminSupportConversationById;

public class GetAdminSupportConversationByIdQuery : IQuery<SupportConversationDetailQri>, IWebRequest
{
    public long StaffUserId { get; set; }
    public long ConversationId { get; set; }
    public long TeacherUserId { get; set; }
    public int MessageTake { get; set; } = 10;
    public long? BeforeMessageId { get; set; }
    public string Path => "/api/Service/SupportChatAdmin/GetConversationById";
}
