using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendAdminSupportStaffMessage;

public class SendAdminSupportStaffMessageCommand : ICommand<string>, IWebRequest
{
    public long StaffUserId { get; set; }
    public long ConversationId { get; set; }
    public long TeacherUserId { get; set; }
    public string? ContentHtml { get; set; }
    public long? ReplyToMessageId { get; set; }
    public string Path => "/api/Service/SupportChatAdmin/SendStaffMessage";
}
