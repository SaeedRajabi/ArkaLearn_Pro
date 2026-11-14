using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportConversationSubject;

public class UpdateSupportConversationSubjectCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Path => "/api/Service/SupportChat/UpdateSubject";
}
