namespace ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs
{
    public interface IChatMessageHub
    {
        Task SendMessageToRoom(string roomId, string senderName, string text);
        Task OnConnectedAsync();
        Task OnDisconnectedAsync(Exception? exception);
        Task NotifyUserJoined(long roomId, string userName);
        Task NotifyUserLeft(long roomId,long userId, string userName);
    }
}
