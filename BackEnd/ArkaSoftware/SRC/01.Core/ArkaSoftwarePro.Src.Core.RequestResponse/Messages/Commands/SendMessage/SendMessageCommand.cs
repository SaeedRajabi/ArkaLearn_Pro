using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Commands.SendMessage
{
    public class SendMessageCommand:ICommand<string> , IWebRequest
    {
        public long RoomId { get; set; }
        public string Text { get; set; } = string.Empty;

        public string Path => "/api/Service/Message/Send";
    }
}
