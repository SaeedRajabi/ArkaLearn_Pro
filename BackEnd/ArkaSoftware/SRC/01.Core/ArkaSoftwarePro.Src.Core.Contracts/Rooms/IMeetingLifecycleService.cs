namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

public interface IMeetingLifecycleService
{
    /// <summary>Ends DB session, notifies all clients, clears in-memory meeting state.</summary>
    Task EndRoomMeetingAsync(long roomId, string reason, CancellationToken cancellationToken = default);
}
