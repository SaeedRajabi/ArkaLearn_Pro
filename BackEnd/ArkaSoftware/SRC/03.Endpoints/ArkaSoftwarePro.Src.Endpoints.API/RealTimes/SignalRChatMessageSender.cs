using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes
{
    // Sender of messages from the server to clients
    public class SignalRChatMessageSender(IHubContext<ChatHub> hubContext) : IChatMessageHub
    {
        public async Task SendMessageToRoom(string roomId, string senderName, string text)
        {
            await hubContext.Clients.Group(roomId).SendAsync("ReceiveMessage" , senderName, text);
        }

        public Task OnConnectedAsync()
        {
            throw new NotImplementedException();
        }

        public Task OnDisconnectedAsync(Exception? exception)
        {
            throw new NotImplementedException();
        }

        public async Task NotifyUserJoined(long roomId, string userName)
        {
            await hubContext.Clients.Group(roomId.ToString())
                .SendAsync("JoinRoom", userName);
        }

        public async Task NotifyUserLeft(long roomId ,long userId, string userName)
        {
            await hubContext.Clients.Group(roomId.ToString())
                .SendAsync("UserWentOffline",userId, userName);
        }
    }
}
