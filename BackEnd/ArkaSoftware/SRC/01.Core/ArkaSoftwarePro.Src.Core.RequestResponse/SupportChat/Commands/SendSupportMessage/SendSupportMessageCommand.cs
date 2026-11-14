using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendSupportMessage;

public class SendSupportMessageCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public long? ReplyToMessageId { get; set; }
    public string? ClientMessageId { get; set; }
    public string Path => "/api/Service/SupportChat/SendMessage";
}
