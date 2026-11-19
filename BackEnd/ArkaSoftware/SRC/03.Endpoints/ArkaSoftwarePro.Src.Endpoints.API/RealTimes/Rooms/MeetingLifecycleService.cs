using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Framework.Src.Core.Contracts.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;

/// <summary>پایان پایدار جلسه، اعلان به کلاینت‌ها و پاک‌سازی حضور و گروه‌های SignalR را هماهنگ می‌کند.</summary>
public sealed class MeetingLifecycleService(
    IHubContext<MeetingHub> hubContext,
    ICommandDispatcher commandDispatcher,
    IRoomCommandRepository rooms,
    IRoomSeatLivePresence presence) : IMeetingLifecycleService
{
    /// <summary>ابتدا پایان جلسه را ثبت، سپس اعضا را آفلاین و پس از اعلان، وضعیت درون‌حافظه‌ای اتاق را حذف می‌کند.</summary>
    /// <param name="roomId">شناسه عددی اتاق.</param>
    /// <param name="reason">علت پایان که همراه رویداد MeetingEnded برای کلاینت‌ها ارسال می‌شود.</param>
    /// <param name="cancellationToken">توکن لغو ارسال رویدادها و حذف عضویت گروه‌ها.</param>
    /// <remarks>ارسال رویداد منتظر اجرای cleanup مرورگر نمی‌ماند؛ LeaveMeeting آن ممکن است پس از پاک‌شدن رجیستری برسد.</remarks>
    public async Task EndRoomMeetingAsync(long roomId, string reason, CancellationToken cancellationToken = default)
    {
        var meetingId = roomId.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var result = await commandDispatcher.Send<EndRoomSessionCommand, bool>(new EndRoomSessionCommand { RoomId = roomId });
        if (result.Status != ApplicationServiceStatus.Ok)
            throw new InvalidOperationException("Could not persist the end of this room session.");

        var room = await rooms.GetWithRoomUsersAsync(roomId);
        if (room != null)
        {
            foreach (var user in room.RoomUsers.Where(x => x.IsRoomUserOnline()))
                room.UpdateRoomUserStatus(user.Id, false);
            await rooms.CommitAsync();
        }
        await hubContext.Clients.Group(meetingId).SendAsync("MeetingEnded", meetingId, reason, cancellationToken);
        await hubContext.Clients.Group(meetingId).SendAsync("TeacherEndedSession", meetingId, cancellationToken);
        await hubContext.Clients.Group(MeetingHub.WaitingGroup(meetingId)).SendAsync("TeacherEndedSession", meetingId, cancellationToken);
        foreach (var connection in MeetingHub.GetLiveConnections(meetingId))
        {
            await hubContext.Groups.RemoveFromGroupAsync(connection.ConnectionId, meetingId, cancellationToken);
            await hubContext.Groups.RemoveFromGroupAsync(connection.ConnectionId, MeetingHub.WaitingGroup(meetingId), cancellationToken);
            if (connection.SeatId is { } seat) presence.UnregisterSeat(roomId, seat, connection.ConnectionId);
        }
        MeetingHub.ClearMeetingState(meetingId);
    }
}
