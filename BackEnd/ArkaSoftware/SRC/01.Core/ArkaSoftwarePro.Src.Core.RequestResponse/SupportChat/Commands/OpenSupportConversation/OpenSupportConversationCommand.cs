using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.OpenSupportConversation;

public class OpenSupportConversationCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long TeacherUserId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? InitialMessageHtml { get; set; }
    public string Path => "/api/Service/SupportChat/Open";
}
