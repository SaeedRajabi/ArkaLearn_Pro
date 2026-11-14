namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

/// <summary>Notifies a live meeting client when an admin/teacher blocks or forces a seat offline.</summary>
public interface IRoomSeatAdminNotifier
{
    Task NotifySeatRemovedByAdminAsync(long roomId, long roomUserId, string action, CancellationToken cancellationToken = default);
}
