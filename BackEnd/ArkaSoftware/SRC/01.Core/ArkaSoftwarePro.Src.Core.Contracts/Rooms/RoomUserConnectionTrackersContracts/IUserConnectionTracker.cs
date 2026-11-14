namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomUserConnectionTrackersContracts
{
    public interface IUserConnectionTracker
    {
        void SetOnline(string userId, string connectionId);
        void SetOffline(string connectionId);
        bool IsUserOnline(string userId);
        List<string> GetOnlineUsers();
    }
}
