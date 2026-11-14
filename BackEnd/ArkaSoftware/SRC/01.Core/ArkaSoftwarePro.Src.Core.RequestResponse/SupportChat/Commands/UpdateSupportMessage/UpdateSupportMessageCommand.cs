using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportMessage;

public class UpdateSupportMessageCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public long MessageId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string Path => "/api/Service/SupportChat/UpdateMessage";
}
