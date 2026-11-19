using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.SignalR;
using Serilog;
using System.Collections.Concurrent;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.SetRoomUserBlocked;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus;
using Framework.Src.Core.RequestResponse.Common;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs
{
    /// <summary>مدیریت حضور، نقش‌ها، پیام‌ها و سیگنالینگ کلاس؛ رسانه Mesh توسط اتصال همتای مرورگر منتقل می‌شود.</summary>
    /// <remarks>رجیستری‌های static متعلق به همین فرایند API هستند و با راه‌اندازی مجدد آن از بین می‌روند.</remarks>
    public class MeetingHub(
        IServiceProvider serviceProvider,
        ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands.IRoomCommandRepository roomRepository,
        IRoomSeatLivePresence roomSeatLivePresence,
        IRoomJoinTicketService joinTicketService,
        IMeetingLifecycleService meetingLifecycle,
        RoomMeetingCoordinator roomCoordinator)
        : Hub
    {
        private sealed record ConnInfo(
            string MeetingId,
            string UserName,
            bool IsHost,
            bool CanModerate,
            RoomMeetingRole Role,
            bool IsGuest);

        public static bool HasActiveHost(string meetingId) => CountActiveHosts(meetingId) > 0;

        public static string WaitingGroup(string meetingId) => $"{meetingId}__waiting";

        public static IReadOnlyList<(string ConnectionId, long? SeatId)> GetLiveConnections(string meetingId) =>
            ConnectionRegistry.Where(x => x.Value.MeetingId == meetingId)
                .Select(x => (x.Key, TryGetRoomSeatJoinContext(meetingId, x.Value.UserName, out _, out var seat)
                    ? (long?)seat : null)).ToList();

        /// <summary>وضعیت درون‌حافظه‌ای جلسه و عضویت اتصال‌های آن را حذف می‌کند.</summary>
        /// <remarks>پس از این عملیات، LeaveMeeting اتصال‌های قبلی دیگر عضویت معتبری در رجیستری پیدا نمی‌کند.</remarks>
        public static void ClearMeetingState(string meetingId)
        {
            MeetingParticipants.TryRemove(meetingId, out _);
            MeetingConnections.TryRemove(meetingId, out _);
            MeetingRequiresTeacherFirst.TryRemove(meetingId, out _);
            MeetingHostCount.TryRemove(meetingId, out _);
            WaitingByMeeting.TryRemove(meetingId, out _);
            RoomStaffLiveConnections.TryRemove(meetingId, out _);
            MeetingBlockedUserNames.TryRemove(meetingId, out _);
            MeetingActiveScreenSharers.TryRemove(meetingId, out _);
            MeetingWebcamOverlays.TryRemove(meetingId, out _);
            MeetingRaisedHands.TryRemove(meetingId, out _);
            MeetingHosts.TryRemove(meetingId, out _);
            MeetingPresenterGrants.TryRemove(meetingId, out _);

            foreach (var key in ConnectionRegistry.Keys.ToArray())
            {
                if (ConnectionRegistry.TryGetValue(key, out var info) && info.MeetingId == meetingId)
                {
                    ConnectionRegistry.TryRemove(key, out _);
                    UserStreams.TryRemove(key, out _);
                }
            }
        }
        private static readonly ConcurrentDictionary<string, List<string>> MeetingParticipants = new();
        private static readonly ConcurrentDictionary<string, string> UserStreams = new();
        private static readonly ConcurrentDictionary<string, string> MeetingHosts = new();

        /// <summary>meetingId -> connectionId -> displayName</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> MeetingConnections = new();

        /// <summary>Any client can set true for this meeting (from room settings).</summary>
        private static readonly ConcurrentDictionary<string, bool> MeetingRequiresTeacherFirst = new();

        /// <summary>meetingId -> number of host/teacher connections currently in the main group</summary>
        private static readonly ConcurrentDictionary<string, int> MeetingHostCount = new();

        /// <summary>meetingId -> waiting connectionId -> displayName (not yet in main group)</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> WaitingByMeeting = new();

        /// <summary>connectionId -> connection metadata (roles from join ticket, not client flags).</summary>
        private static readonly ConcurrentDictionary<string, ConnInfo> ConnectionRegistry = new();

        /// <summary>meetingId -> blocked display names (session-level, in-memory).</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> MeetingBlockedUserNames = new();

        /// <summary>Small mesh rooms may show several presenter screen tiles.</summary>
        public const int MaxConcurrentScreenShares = 4;

        /// <summary>meetingId -> set of connectionIds currently sharing screen.</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> MeetingActiveScreenSharers = new();

        /// <summary>meetingId -> connectionIds granted the presenter role by the host (persisted server-side so media actions can be authorized).</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> MeetingPresenterGrants = new();

        // Granular permission flags stored per participant connection.
        private const byte GrantVoice = 1;
        private const byte GrantVideo = 2;
        private const byte GrantPresenter = 4;

        private sealed record WebcamOverlayState(
            double X,
            double Y,
            double Width,
            double Height,
            string? StyleJson);

        /// <summary>meetingId -> publisherConnectionId -> last webcam overlay.</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, WebcamOverlayState>> MeetingWebcamOverlays = new();

        /// <summary>meetingId -> connectionIds with hand raised.</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> MeetingRaisedHands = new();

        /// <summary>meetingId -> dashboard/staff user id -> active SignalR connection id.</summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> RoomStaffLiveConnections = new();

        private static string NormalizeUserName(string userName) => (userName ?? string.Empty).Trim();

        private static int CountActiveHosts(string meetingId)
        {
            if (!MeetingConnections.TryGetValue(meetingId, out var dial)) return 0;
            return dial.Keys.Count(connId => ConnectionRegistry.TryGetValue(connId, out var info) && info.IsHost);
        }

        private static (string role, bool canModerate) GetConnectionRole(string connectionId)
        {
            if (!ConnectionRegistry.TryGetValue(connectionId, out var info))
                return ("student", false);

            var role = info.Role switch
            {
                RoomMeetingRole.Teacher => "teacher",
                RoomMeetingRole.Moderator => "moderator",
                RoomMeetingRole.Guest => "guest",
                _ => "student"
            };
            return (role, info.CanModerate);
        }

        private static byte GetGrantFlags(string meetingId, string connectionId) =>
            MeetingPresenterGrants.TryGetValue(meetingId, out var grants) &&
            grants.TryGetValue(connectionId, out var flags)
                ? flags
                : (byte)0;

        private static bool IsGrantedPresenter(string meetingId, string connectionId) =>
            (GetGrantFlags(meetingId, connectionId) & GrantPresenter) != 0;

        private static bool IsVoiceGranted(string meetingId, string connectionId) =>
            (GetGrantFlags(meetingId, connectionId) & GrantVoice) != 0;

        private static bool IsVideoGranted(string meetingId, string connectionId) =>
            (GetGrantFlags(meetingId, connectionId) & GrantVideo) != 0;

        private static object BuildPeerSyncEntry(string connectionId, string userName)
        {
            var (role, canModerate) = GetConnectionRole(connectionId);
            var meetingId = ConnectionRegistry.TryGetValue(connectionId, out var info) ? info.MeetingId : null;
            var isPresenter = meetingId != null && IsGrantedPresenter(meetingId, connectionId);
            var voiceGranted = meetingId != null && IsVoiceGranted(meetingId, connectionId);
            var videoGranted = meetingId != null && IsVideoGranted(meetingId, connectionId);
            return new { connectionId, userName, role, canModerate, isPresenter, voiceGranted, videoGranted };
        }

        private static object BuildParticipantRoster(string meetingId)
        {
            if (!MeetingConnections.TryGetValue(meetingId, out var dial))
                return Array.Empty<object>();

            return dial.Select(kv =>
            {
                var role = "student";
                var canModerate = false;
                if (ConnectionRegistry.TryGetValue(kv.Key, out var info))
                {
                    canModerate = info.CanModerate;
                    role = info.Role switch
                    {
                        RoomMeetingRole.Teacher => "teacher",
                        RoomMeetingRole.Moderator => "moderator",
                        RoomMeetingRole.Guest => "guest",
                        _ => "student"
                    };
                }

                return (object)new
                {
                    connectionId = kv.Key,
                    userName = kv.Value,
                    role,
                    canModerate,
                    isPresenter = IsGrantedPresenter(meetingId, kv.Key)
                };
            }).ToList();
        }

        private async Task SendRoomJoinInitializedAsync(string meetingId, string connectionId, bool inWaitingRoom)
        {
            var hostCount = CountActiveHosts(meetingId);
            await Clients.Client(connectionId).SendAsync("RoomJoinInitialized", new
            {
                inWaitingRoom,
                teacherPresent = hostCount > 0,
                hostCount,
                peers = BuildParticipantRoster(meetingId)
            });
        }

        /// <summary>Parses hub display JSON when clients set roomSeatLogin and a numeric seat id.</summary>
        private static bool TryGetRoomSeatJoinContext(string meetingId, string userNameJsonOrRaw, out long roomId, out long seatUserId)
        {
            roomId = default;
            seatUserId = default;
            if (!long.TryParse(meetingId, out roomId))
                return false;

            try
            {
                using var doc = JsonDocument.Parse(userNameJsonOrRaw ?? "{}");
                var root = doc.RootElement;
                if (!root.TryGetProperty("roomSeatLogin", out var rs) ||
                    rs.ValueKind != JsonValueKind.True ||
                    !root.TryGetProperty("id", out var idEl))
                    return false;

                var rawId = idEl.GetString();
                return !string.IsNullOrEmpty(rawId) && long.TryParse(rawId, out seatUserId);
            }
            catch
            {
                return false;
            }
        }

        private static string? TryExtractUserId(string? userNameJson)
        {
            try
            {
                using var doc = JsonDocument.Parse(userNameJson ?? "{}");
                if (doc.RootElement.TryGetProperty("id", out var idEl))
                {
                    var id = idEl.GetString();
                    return string.IsNullOrWhiteSpace(id) ? null : id;
                }
            }
            catch
            {
                /* ignore */
            }

            return null;
        }

        private static bool DisplayJsonHasUserId(string? userNameJson, string userId) =>
            !string.IsNullOrWhiteSpace(userId) &&
            string.Equals(TryExtractUserId(userNameJson), userId, StringComparison.Ordinal);

        /// <summary>
        /// Ensures a single live presence per identity: removes stale connections for the same user id
        /// (reconnect / second tab) without ending the meeting host gate for the rejoining user.
        /// </summary>
        private async Task SupersedeIdentityConnectionsAsync(string meetingId, string? userId, string newConnectionId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return;

            var stale = new List<(string ConnId, string UserName, bool IsHost)>();

            void Consider(string connId, string userName, bool isHost)
            {
                if (string.Equals(connId, newConnectionId, StringComparison.Ordinal))
                    return;
                if (!DisplayJsonHasUserId(userName, userId))
                    return;
                if (stale.Exists(s => s.ConnId == connId))
                    return;
                stale.Add((connId, userName, isHost));
            }

            if (MeetingConnections.TryGetValue(meetingId, out var dial))
            {
                foreach (var kv in dial)
                {
                    var isHost = ConnectionRegistry.TryGetValue(kv.Key, out var info) && info.IsHost;
                    Consider(kv.Key, kv.Value, isHost);
                }
            }

            if (WaitingByMeeting.TryGetValue(meetingId, out var waiting))
            {
                foreach (var kv in waiting)
                {
                    var isHost = ConnectionRegistry.TryGetValue(kv.Key, out var info) && info.IsHost;
                    Consider(kv.Key, kv.Value, isHost);
                }
            }

            if (RoomStaffLiveConnections.TryGetValue(meetingId, out var staffMap) &&
                staffMap.TryGetValue(userId, out var staffConn) &&
                !string.Equals(staffConn, newConnectionId, StringComparison.Ordinal) &&
                !stale.Exists(s => s.ConnId == staffConn))
            {
                if (ConnectionRegistry.TryGetValue(staffConn, out var info))
                    stale.Add((staffConn, info.UserName, info.IsHost));
                else if (MeetingConnections.TryGetValue(meetingId, out var d) && d.TryGetValue(staffConn, out var un))
                    stale.Add((staffConn, un, true));
            }

            foreach (var (connId, userName, isHost) in stale)
            {
                try
                {
                    await Clients.Client(connId).SendAsync("SupersededByNewSession", meetingId);
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Could not notify superseded connection {ConnId}", connId);
                }

                ConnectionRegistry.TryRemove(connId, out _);
                UnregisterLiveSessionForTakeover(meetingId, userName, connId);

                await Groups.RemoveFromGroupAsync(connId, meetingId);
                await Groups.RemoveFromGroupAsync(connId, WaitingGroup(meetingId));

                if (MeetingParticipants.ContainsKey(meetingId))
                {
                    MeetingParticipants[meetingId].Remove(userName);
                    if (MeetingParticipants[meetingId].Count == 0)
                        MeetingParticipants.TryRemove(meetingId, out _);
                }

                if (MeetingConnections.TryGetValue(meetingId, out var d))
                {
                    d.TryRemove(connId, out _);
                    if (d.Count == 0)
                        MeetingConnections.TryRemove(meetingId, out _);
                }

                if (WaitingByMeeting.TryGetValue(meetingId, out var w))
                    w.TryRemove(connId, out _);

                if (isHost)
                    MeetingHostCount.AddOrUpdate(meetingId, 0, (_, c) => Math.Max(0, c - 1));

                if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var sharers) &&
                    sharers.TryRemove(connId, out _))
                {
                    await Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", connId);
                }

                if (MeetingPresenterGrants.TryGetValue(meetingId, out var supersededGrants))
                    supersededGrants.TryRemove(connId, out _);

                if (MeetingRaisedHands.TryGetValue(meetingId, out var hands) &&
                    hands.TryRemove(connId, out _))
                {
                    await Clients.Group(meetingId).SendAsync("HandLowered", connId);
                }

                if (MeetingWebcamOverlays.TryGetValue(meetingId, out var overlays))
                    overlays.TryRemove(connId, out _);

                await Clients.Group(meetingId).SendAsync("UserLeft", userName, connId);
                Log.Information(
                    "Superseded stale connection {OldConn} with {NewConn} for identity {UserId} in meeting {MeetingId}",
                    connId, newConnectionId, userId, meetingId);
            }
        }

        /// <summary>Clears seat/staff maps without marking the seat offline (takeover keeps presence).</summary>
        private void UnregisterLiveSessionForTakeover(string meetingId, string userName, string connectionId)
        {
            if (TryGetRoomSeatJoinContext(meetingId, userName, out var roomId, out var seatUserId))
            {
                roomSeatLivePresence.UnregisterSeat(roomId, seatUserId, connectionId);
                return;
            }

            try
            {
                using var doc = JsonDocument.Parse(userName ?? "{}");
                if (doc.RootElement.TryGetProperty("id", out var idEl))
                {
                    var staffId = idEl.GetString();
                    if (!string.IsNullOrWhiteSpace(staffId) &&
                        RoomStaffLiveConnections.TryGetValue(meetingId, out var staffMap) &&
                        staffMap.TryGetValue(staffId, out var conn) &&
                        conn == connectionId)
                    {
                        staffMap.TryRemove(staffId, out _);
                    }
                }
            }
            catch
            {
                /* ignore */
            }
        }

        private static int CountMeetingParticipants(string meetingId) =>
            ConnectionRegistry.Values.Count(v => v.MeetingId == meetingId && !v.IsHost);

        private static int CountMeetingGuests(string meetingId) =>
            ConnectionRegistry.Values.Count(v => v.MeetingId == meetingId && v.IsGuest);

        public override async Task OnConnectedAsync()
        {
            Log.Information($"🔵 Connection established: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public async Task JoinMeeting(
            string meetingId,
            string userName,
            bool isHostTeacher,
            bool teacherEntersFirst,
            string? joinTicket = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(meetingId) || string.IsNullOrWhiteSpace(userName))
                {
                    Log.Error($"Invalid JoinMeeting request. meetingId: {meetingId}, userName: {userName}");
                    throw new HubException("Invalid meetingId or userName.");
                }

                if (!long.TryParse(meetingId, out var roomIdNum) || roomIdNum <= 0)
                    throw new HubException("Invalid room id.");

                meetingId = roomIdNum.ToString(System.Globalization.CultureInfo.InvariantCulture);
                var claims = joinTicketService.Validate(joinTicket, roomIdNum);
                if (claims is null)
                {
                    await Clients.Caller.SendAsync("JoinDeniedInvalidTicket");
                    return;
                }
                var meetingRole = claims.Role;
                var isHostTeacherResolved = meetingRole is RoomMeetingRole.Teacher or RoomMeetingRole.Moderator;
                var canModerate = isHostTeacherResolved;
                var isGuestJoin = meetingRole == RoomMeetingRole.Guest;
                var trustedId = meetingRole == RoomMeetingRole.Student ? claims.SeatUserId?.ToString()
                    : isHostTeacherResolved ? claims.StaffUserId?.ToString()
                    : claims.ParticipantKey.StartsWith("guest:", StringComparison.Ordinal) ? claims.ParticipantKey[6..] : null;
                try
                {
                    var display = JsonNode.Parse(userName)?.AsObject();
                    if (string.IsNullOrWhiteSpace(trustedId) || display is null || display["id"]?.ToString() != trustedId)
                        throw new InvalidOperationException("Ticket identity mismatch.");
                    display["id"] = trustedId;
                    display["roomSeatLogin"] = meetingRole == RoomMeetingRole.Student;
                    display["role"] = meetingRole.ToString().ToLowerInvariant();
                    display["meetingRole"] = meetingRole.ToString().ToLowerInvariant();
                    display["isHostTeacher"] = isHostTeacherResolved;
                    display["canModerate"] = canModerate;
                    userName = display.ToJsonString();
                }
                catch
                {
                    await Clients.Caller.SendAsync("JoinDeniedInvalidTicket");
                    return;
                }

                var roomEntity = await roomRepository.GetWithRoomUsersAsync(roomIdNum);
                if (roomEntity is null || roomEntity.IsDelete || roomEntity.Status != ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations.StatusType.Active)
                {
                    await Clients.Caller.SendAsync("JoinDeniedNotInRoom");
                    return;
                }
                using var transition = await roomCoordinator.EnterAsync(meetingId, Context.ConnectionAborted);
                if (ConnectionRegistry.TryGetValue(Context.ConnectionId, out var existingJoin))
                {
                    if (existingJoin.MeetingId != meetingId || TryExtractUserId(existingJoin.UserName) != trustedId)
                        throw new HubException("This connection has already joined another identity or room.");
                    await SendRoomJoinInitializedAsync(meetingId, Context.ConnectionId,
                        WaitingByMeeting.TryGetValue(meetingId, out var lobby) && lobby.ContainsKey(Context.ConnectionId));
                    return;
                }
                var teacherEntersFirstResolved = roomEntity.TeacherEntersFirst;
                if (roomEntity != null)
                {
                    if (isGuestJoin)
                    {
                        if (!roomEntity.IsGuest || roomEntity.GuestQuantity <= 0)
                        {
                            await Clients.Caller.SendAsync("JoinDeniedGuestsDisabled");
                            return;
                        }

                        var currentGuests = ConnectionRegistry.Values.Count(v => v.MeetingId == meetingId && v.IsGuest && TryExtractUserId(v.UserName) != trustedId);
                        if (roomEntity.GuestQuantity > 0 && currentGuests >= roomEntity.GuestQuantity)
                        {
                            await Clients.Caller.SendAsync("JoinDeniedGuestCapacityFull");
                            return;
                        }
                    }

                    if (!isHostTeacherResolved)
                    {
                        var currentParticipants = ConnectionRegistry.Values.Count(v => v.MeetingId == meetingId && !v.IsHost && TryExtractUserId(v.UserName) != trustedId);
                        if (roomEntity.Capacity > 0 && currentParticipants >= roomEntity.Capacity)
                        {
                            await Clients.Caller.SendAsync("JoinDeniedRoomFull");
                            return;
                        }
                    }
                }

                Log.Information(
                    "{User} joining room {RoomId} role={Role} host={Host} tef={Tef}",
                    userName, roomIdNum, meetingRole, isHostTeacherResolved, teacherEntersFirstResolved);

                var normName = NormalizeUserName(userName);
                if (MeetingBlockedUserNames.TryGetValue(meetingId, out var blocked) && blocked.ContainsKey(normName))
                {
                    await Clients.Caller.SendAsync("JoinDeniedBlocked");
                    Log.Warning($"{userName} blocked from {meetingId}");
                    return;
                }
                
                long? seatRoomIdForSession = null;
                long? seatUserIdForSession = null;
                var identityUserId = TryExtractUserId(userName);

                if (TryGetRoomSeatJoinContext(meetingId, userName, out var seatRoomId, out var seatUserId))
                {
                    seatRoomIdForSession = seatRoomId;
                    seatUserIdForSession = seatUserId;
                    var gate = await roomRepository.TryGetRoomSeatLiveGateAsync(seatRoomId, seatUserId);
                    if (gate == null)
                    {
                        await Clients.Caller.SendAsync("JoinDeniedNotInRoom");
                        Log.Warning("Join denied — seat {SeatId} not in room {RoomId}", seatUserId, seatRoomId);
                        return;
                    }

                    if (gate.IsBlocked)
                    {
                        await Clients.Caller.SendAsync("JoinDeniedBlocked");
                        Log.Warning("Join denied — blocked seat {SeatId} room {RoomId}", seatUserId, seatRoomId);
                        return;
                    }

                    // Single presence: supersede any stale connection for this seat/identity (reconnect / second tab).
                    await SupersedeIdentityConnectionsAsync(meetingId, identityUserId ?? seatUserId.ToString(), Context.ConnectionId);

                    if (gate.IsOnline && !roomSeatLivePresence.IsSeatLive(seatRoomId, seatUserId))
                        await ReleaseRoomSeatOnlineAsync(seatRoomId, seatUserId);
                }
                else if (!string.IsNullOrWhiteSpace(identityUserId))
                {
                    await SupersedeIdentityConnectionsAsync(meetingId, identityUserId, Context.ConnectionId);
                }

                ConnectionRegistry[Context.ConnectionId] = new ConnInfo(
                    meetingId, userName, isHostTeacherResolved, canModerate, meetingRole, isGuestJoin);

                if (teacherEntersFirstResolved)
                    MeetingRequiresTeacherFirst.AddOrUpdate(meetingId, true, (_, _) => true);

                bool isGate = MeetingRequiresTeacherFirst.GetValueOrDefault(meetingId);
                var hostsInRoom = CountActiveHosts(meetingId);

                if (isGate && !isHostTeacherResolved && hostsInRoom == 0)
                {
                    var waiting = WaitingByMeeting.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, string>());
                    waiting[Context.ConnectionId] = userName;
                    await Groups.AddToGroupAsync(Context.ConnectionId, WaitingGroup(meetingId));

                    if (seatRoomIdForSession.HasValue && seatUserIdForSession.HasValue)
                    {
                        roomSeatLivePresence.TakeOverSeat(
                            seatRoomIdForSession.Value,
                            seatUserIdForSession.Value,
                            Context.ConnectionId);
                        await MarkRoomSeatOnlineAsync(seatRoomIdForSession.Value, seatUserIdForSession.Value);
                    }

                    await Clients.Caller.SendAsync("WaitingForTeacher");
                    await SendRoomJoinInitializedAsync(meetingId, Context.ConnectionId, inWaitingRoom: true);
                    Log.Information($"{userName} queued in waiting room for {meetingId}");
                    return;
                }

                if (isHostTeacherResolved)
                    roomCoordinator.CancelHostDeparture(meetingId);
                if (isHostTeacherResolved)
                    MeetingHostCount.AddOrUpdate(meetingId, 1, (_, c) => c + 1);

                await CompleteJoinMainGroup(meetingId, userName);

                if (seatUserIdForSession.HasValue && long.TryParse(meetingId, out var regRoomId))
                {
                    roomSeatLivePresence.TakeOverSeat(regRoomId, seatUserIdForSession.Value, Context.ConnectionId);
                    await MarkRoomSeatOnlineAsync(regRoomId, seatUserIdForSession.Value);
                }
                else if (isHostTeacherResolved && !string.IsNullOrWhiteSpace(identityUserId))
                {
                    RoomStaffLiveConnections.GetOrAdd(
                            meetingId,
                            _ => new ConcurrentDictionary<string, string>(StringComparer.Ordinal))
                        [identityUserId] = Context.ConnectionId;
                }

                if (isHostTeacherResolved)
                    await AdmitWaitingUsersAsync(meetingId);

                Log.Information($"{userName} successfully joined meeting {meetingId}");
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in JoinMeeting: {ex}");
                throw new HubException("Could not join this meeting.");
            }
        }

        private async Task CompleteJoinMainGroup(string meetingId, string userName)
        {
            if (long.TryParse(meetingId, out var roomId))
            {
                string? userId = null;
                try
                {
                    var parsed = System.Text.Json.JsonDocument.Parse(userName);
                    if (parsed.RootElement.TryGetProperty("id", out var idElem))
                    {
                        userId = idElem.GetString();
                    }
                }
                catch { }

                try
                {
                    using var scope = serviceProvider.CreateScope();
                    var commandDispatcher = scope.ServiceProvider.GetRequiredService<Framework.Src.Core.Contracts.ApplicationService.Commands.ICommandDispatcher>();
                    var sessionResult = await commandDispatcher.Send<ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands.StartRoomSessionCommand, long>(
                        new ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands.StartRoomSessionCommand
                        {
                            RoomId = roomId,
                            StartedByUserId = userId
                        });
                    if (sessionResult.Status != ApplicationServiceStatus.Ok)
                        Log.Warning("StartRoomSession returned {Status} for room {RoomId}", sessionResult.Status, roomId);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "StartRoomSession failed for room {RoomId}; continuing join", roomId);
                }
            }

            if (!MeetingParticipants.ContainsKey(meetingId))
                MeetingParticipants[meetingId] = new List<string>();

            if (!MeetingParticipants[meetingId].Contains(userName))
                MeetingParticipants[meetingId].Add(userName);

            var dial = MeetingConnections.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, string>());
            dial[Context.ConnectionId] = userName;

            await Groups.AddToGroupAsync(Context.ConnectionId, meetingId);

            var others = dial
                .Where(kv => kv.Key != Context.ConnectionId)
                .Select(kv => BuildPeerSyncEntry(kv.Key, kv.Value))
                .ToList();
            await Clients.Caller.SendAsync("SyncExistingPeers", others);

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var activeSharers))
            {
                foreach (var sharerId in activeSharers.Keys)
                    await Clients.Caller.SendAsync("ParticipantScreenShared", sharerId);
            }

            if (MeetingRaisedHands.TryGetValue(meetingId, out var raisedHands))
            {
                foreach (var handId in raisedHands.Keys)
                    await Clients.Caller.SendAsync("HandRaised", handId);
            }

            if (MeetingWebcamOverlays.TryGetValue(meetingId, out var overlaysForJoin))
            {
                foreach (var (publisherId, overlay) in overlaysForJoin)
                {
                    await Clients.Caller.SendAsync(
                        "WebcamOverlayUpdated",
                        overlay.X,
                        overlay.Y,
                        overlay.Width,
                        overlay.Height,
                        overlay.StyleJson,
                        publisherId);
                }
            }

            var (joinRole, joinCanModerate) = GetConnectionRole(Context.ConnectionId);
            var joinIsPresenter = IsGrantedPresenter(meetingId, Context.ConnectionId);
            var joinVoiceGranted = IsVoiceGranted(meetingId, Context.ConnectionId);
            var joinVideoGranted = IsVideoGranted(meetingId, Context.ConnectionId);
            await Clients.OthersInGroup(meetingId).SendAsync(
                "UserJoined", userName, Context.ConnectionId, joinRole, joinCanModerate, joinIsPresenter,
                joinVoiceGranted, joinVideoGranted);
            await Clients.Group(meetingId).SendAsync("ReceiveParticipantList", MeetingParticipants[meetingId]);
            await Clients.OthersInGroup(meetingId).SendAsync("ResyncMediaStateRequested");
            await SendRoomJoinInitializedAsync(meetingId, Context.ConnectionId, inWaitingRoom: false);
        }

        private async Task AdmitWaitingUsersAsync(string meetingId)
        {
            if (!WaitingByMeeting.TryGetValue(meetingId, out var waiting) || waiting.Count == 0)
                return;

            var snapshot = waiting.ToArray();
            foreach (var (connId, wName) in snapshot)
            {
                if (!waiting.TryRemove(connId, out _))
                    continue;

                await Groups.RemoveFromGroupAsync(connId, WaitingGroup(meetingId));

                // Temporarily invoke join as that connection — use IHubContext pattern not available; re-enter logic:
                // We must run CompleteJoinMainGroup with the waiting client's connection id.
                // SignalR does not let us switch Context; use group ops from hub instance with Clients.Client(connId).
                await AdmitSingleWaitingUser(meetingId, connId, wName);
            }
        }

        private async Task AdmitSingleWaitingUser(string meetingId, string connectionId, string userName)
        {
            if (!MeetingParticipants.ContainsKey(meetingId))
                MeetingParticipants[meetingId] = new List<string>();
            if (!MeetingParticipants[meetingId].Contains(userName))
                MeetingParticipants[meetingId].Add(userName);

            var dial = MeetingConnections.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, string>());
            dial[connectionId] = userName;

            await Groups.AddToGroupAsync(connectionId, meetingId);

            var others = dial
                .Where(kv => kv.Key != connectionId)
                .Select(kv => BuildPeerSyncEntry(kv.Key, kv.Value))
                .ToList();
            await Clients.Client(connectionId).SendAsync("SyncExistingPeers", others);

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var activeSharersAdmit))
            {
                foreach (var sharerId in activeSharersAdmit.Keys)
                    await Clients.Client(connectionId).SendAsync("ParticipantScreenShared", sharerId);
            }

            if (MeetingRaisedHands.TryGetValue(meetingId, out var raisedHandsAdmit))
            {
                foreach (var handId in raisedHandsAdmit.Keys)
                    await Clients.Client(connectionId).SendAsync("HandRaised", handId);
            }

            if (MeetingWebcamOverlays.TryGetValue(meetingId, out var overlaysAdmit))
            {
                foreach (var (publisherId, overlay) in overlaysAdmit)
                {
                    await Clients.Client(connectionId).SendAsync(
                        "WebcamOverlayUpdated",
                        overlay.X,
                        overlay.Y,
                        overlay.Width,
                        overlay.Height,
                        overlay.StyleJson,
                        publisherId);
                }
            }

            var (joinRole, joinCanModerate) = GetConnectionRole(connectionId);
            var joinIsPresenter = IsGrantedPresenter(meetingId, connectionId);
            var joinVoiceGranted = IsVoiceGranted(meetingId, connectionId);
            var joinVideoGranted = IsVideoGranted(meetingId, connectionId);
            await Clients.GroupExcept(meetingId, connectionId).SendAsync(
                "UserJoined", userName, connectionId, joinRole, joinCanModerate, joinIsPresenter,
                joinVoiceGranted, joinVideoGranted);
            
            var currentParticipants = MeetingParticipants[meetingId].ToList();
            await Clients.Group(meetingId).SendAsync("ReceiveParticipantList", currentParticipants);
            await Clients.Client(connectionId).SendAsync("AdmittedToRoom");
            await Clients.OthersInGroup(meetingId).SendAsync("ResyncMediaStateRequested");
            await SendRoomJoinInitializedAsync(meetingId, connectionId, inWaitingRoom: false);

            if (TryGetRoomSeatJoinContext(meetingId, userName, out var admitRoomId, out var admitSeatId))
            {
                roomSeatLivePresence.TakeOverSeat(admitRoomId, admitSeatId, connectionId);
                await MarkRoomSeatOnlineAsync(admitRoomId, admitSeatId);
            }
        }

        /// <summary>عضویت اتصال فراخواننده را حذف کرده و خروج را به مسیر پاک‌سازی و مدیریت خروج میزبان می‌سپارد.</summary>
        /// <param name="meetingId">شناسه جلسه‌ای که باید با رجیستری همین اتصال تطبیق داشته باشد.</param>
        /// <param name="userName">پارامتر سازگاری کلاینت؛ نام معتبر از رجیستری گرفته می‌شود.</param>
        /// <param name="isHostTeacher">پارامتر سازگاری کلاینت؛ نقش معتبر از رجیستری گرفته می‌شود.</param>
        /// <exception cref="HubException">اتصال عضو نیست یا شناسه جلسه با عضویت فعلی تطبیق ندارد.</exception>
        /// <remarks>
        /// این متد فعلاً در برابر خروج تکراری idempotent نیست: خروج موفق قبلی، قطع اتصال یا ClearMeetingState
        /// می‌تواند باعث خطای خروج بعدی شود. بررسی اولیه عضویت پیش از ورود به قفل هماهنگ‌کننده است.
        /// </remarks>
        public async Task LeaveMeeting(string meetingId, string userName, bool isHostTeacher)
        {
            if (!ConnectionRegistry.TryGetValue(Context.ConnectionId, out var info) || info.MeetingId != meetingId)
                throw new HubException("Not in this meeting.");
            using var transition = await roomCoordinator.EnterAsync(info.MeetingId);
            if (ConnectionRegistry.TryRemove(Context.ConnectionId, out info))
                await LeaveMeetingFromRegistry(info.MeetingId, info.UserName, info.IsHost, Context.ConnectionId, notifyHostDeparture: true);
        }

        private async Task HandleHostDepartureAsync(string meetingId, bool wasHost, bool allowReconnect = false)
        {
            var gate = MeetingRequiresTeacherFirst.GetValueOrDefault(meetingId);
            if (!wasHost)
                return;

            MeetingHostCount.AddOrUpdate(meetingId, 0, (_, c) => Math.Max(0, c - 1));
            var hostsLeft = CountActiveHosts(meetingId);
            if (hostsLeft > 0)
                return;

            if (allowReconnect)
            {
                roomCoordinator.ScheduleHostDeparture(meetingId);
                return;
            }
            roomCoordinator.CancelHostDeparture(meetingId);
            if (long.TryParse(meetingId, out var roomId))
                await meetingLifecycle.EndRoomMeetingAsync(roomId, "teacher_left");
            else
            {
                await Clients.Group(meetingId).SendAsync("TeacherEndedSession", meetingId);
                await Clients.Group(WaitingGroup(meetingId)).SendAsync("TeacherEndedSession", meetingId);
            }
        }

        private string RequireMainRoomMember(string meetingId)
        {
            if (!TryGetCallerMeeting(out var room, out var name, out _) || room != meetingId ||
                !MeetingConnections.TryGetValue(room, out var members) || !members.ContainsKey(Context.ConnectionId))
                throw new HubException("Not an active participant in this meeting.");
            return name;
        }

        public async Task SendMessage(string meetingId, string userName, string message)
        {
            var trustedName = RequireMainRoomMember(meetingId);
            if (string.IsNullOrWhiteSpace(message) || message.Length > 4000)
                throw new HubException("Message length must be between 1 and 4000 characters.");
            await Clients.Group(meetingId).SendAsync("ReceiveMessage", trustedName, message);
        }

        public async Task SendSignal(string targetConnectionId, string signal)
        {
            if (!TryGetCallerMeeting(out var meetingId, out _, out _) || string.IsNullOrWhiteSpace(signal) || signal.Length > 1024 * 1024)
                throw new HubException("Invalid signal.");
            RequireMainRoomMember(meetingId);
            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var target) || target.MeetingId != meetingId ||
                !MeetingConnections[meetingId].ContainsKey(targetConnectionId))
                throw new HubException("The signal target is not in this meeting.");
            await Clients.Client(targetConnectionId).SendAsync("ReceiveSignal", Context.ConnectionId, signal);
        }

        // Only an invalidation is sent; clients reload persisted file metadata through
        // GetRoomFiles instead of trusting client-supplied download URLs or uploader names.
        public async Task NotifyRoomFilesChanged(string meetingId)
        {
            if (!TryGetCallerMeeting(out var callerMeetingId, out var callerName, out _) || callerMeetingId != meetingId)
                throw new HubException("Not in this meeting.");
            await Clients.OthersInGroup(meetingId).SendAsync("RoomFilesChanged", Context.ConnectionId, callerName);
        }

        private bool TryGetCallerMeeting(out string meetingId, out string userName, out bool canModerate)
        {
            meetingId = string.Empty;
            userName = string.Empty;
            canModerate = false;
            if (!ConnectionRegistry.TryGetValue(Context.ConnectionId, out var info) ||
                !MeetingConnections.TryGetValue(info.MeetingId, out var live) || !live.ContainsKey(Context.ConnectionId))
                return false;
            meetingId = info.MeetingId;
            userName = info.UserName;
            canModerate = info.CanModerate;
            return true;
        }

        /// <summary>
        /// Resolves a roster row to the participant's CURRENT connection: a registry hit wins;
        /// otherwise the newest live connection whose user name matches (raw JSON or display name).
        /// </summary>
        private bool TryResolveMeetingParticipant(
            string meetingId,
            string targetConnectionId,
            string? targetUserName,
            out string resolvedConnectionId,
            out ConnInfo targetInfo)
        {
            resolvedConnectionId = targetConnectionId;
            if (ConnectionRegistry.TryGetValue(targetConnectionId, out targetInfo!) &&
                targetInfo.MeetingId == meetingId)
            {
                return true;
            }

            var fallback = FindParticipantConnectionId(meetingId, targetUserName);
            if (fallback is not null &&
                ConnectionRegistry.TryGetValue(fallback, out var fallbackInfo) &&
                fallbackInfo.MeetingId == meetingId)
            {
                resolvedConnectionId = fallback;
                targetInfo = fallbackInfo;
                Log.Information(
                    "Resolved stale roster connection {OldConn} -> {NewConn} for {Target} in meeting {MeetingId}",
                    targetConnectionId, fallback, targetUserName, meetingId);
                return true;
            }

            return false;
        }

        private static bool MatchesTargetUserName(string storedUserName, string targetUserName)
        {
            var raw = NormalizeUserName(storedUserName);
            if (string.Equals(raw, targetUserName, StringComparison.OrdinalIgnoreCase))
                return true;

            try
            {
                using var doc = JsonDocument.Parse(storedUserName);
                if (doc.RootElement.TryGetProperty("name", out var nameEl) &&
                    string.Equals(NormalizeUserName(nameEl.GetString()), targetUserName, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            catch
            {
                /* not JSON — raw comparison already done */
            }

            return false;
        }

        private string? FindParticipantConnectionId(string meetingId, string? targetUserName)
        {
            if (string.IsNullOrWhiteSpace(targetUserName))
                return null;

            var wanted = NormalizeUserName(targetUserName);

            if (MeetingConnections.TryGetValue(meetingId, out var dial))
            {
                foreach (var kv in dial)
                {
                    if (MatchesTargetUserName(kv.Value, wanted) &&
                        ConnectionRegistry.TryGetValue(kv.Key, out var info) &&
                        info.MeetingId == meetingId)
                    {
                        return kv.Key;
                    }
                }
            }

            if (WaitingByMeeting.TryGetValue(meetingId, out var waiting))
            {
                foreach (var kv in waiting)
                {
                    if (MatchesTargetUserName(kv.Value, wanted) &&
                        ConnectionRegistry.TryGetValue(kv.Key, out var info) &&
                        info.MeetingId == meetingId)
                    {
                        return kv.Key;
                    }
                }
            }

            return null;
        }

        /// <summary>Host removes a participant from the meeting. If blockUserName is true, that display name cannot re-join this meeting until server restart.</summary>
        public async Task KickParticipant(string meetingId, string targetConnectionId, string? targetUserName, bool blockUserName)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canMod) || !canMod || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can remove participants.");

            if (string.IsNullOrWhiteSpace(targetConnectionId) || targetConnectionId == Context.ConnectionId)
                throw new HubException("Invalid target.");

            // Kicking is idempotent. A participant can disconnect (or reconnect with a
            // new connection id) between rendering the host roster and this invocation.
            // Resolve the current connection where possible; otherwise clean the stale
            // roster entry and return success instead of throwing "Participant not found".
            var targetResolved = TryResolveMeetingParticipant(
                meetingId,
                targetConnectionId,
                targetUserName,
                out var resolvedConnectionId,
                out var targetInfo);

            var targetName = targetUserName ?? string.Empty;
            var targetIsHost = false;
            if (targetResolved)
            {
                targetName = targetInfo.UserName;
                targetIsHost = targetInfo.IsHost;
            }
            else
            {
                if (MeetingConnections.TryGetValue(meetingId, out var staleDial) &&
                    staleDial.TryGetValue(targetConnectionId, out var staleMeetingName))
                {
                    targetName = staleMeetingName;
                }
                else if (WaitingByMeeting.TryGetValue(meetingId, out var staleWaiting) &&
                         staleWaiting.TryGetValue(targetConnectionId, out var staleWaitingName))
                {
                    targetName = staleWaitingName;
                }

                resolvedConnectionId = targetConnectionId;
                Log.Information(
                    "Kick treated as already completed for stale connection {ConnectionId} ({Target}) in meeting {MeetingId}",
                    targetConnectionId,
                    targetUserName,
                    meetingId);
            }

            if (blockUserName && !string.IsNullOrWhiteSpace(targetName))
            {
                var blocked = MeetingBlockedUserNames.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase));
                blocked[NormalizeUserName(targetName)] = 1;
            }

            if (blockUserName && long.TryParse(meetingId, out var kickRoomId) &&
                TryGetRoomSeatJoinContext(meetingId, targetName, out _, out var seatToBlock))
            {
                try
                {
                    using var scope = serviceProvider.CreateScope();
                    var commandDispatcher = scope.ServiceProvider.GetRequiredService<Framework.Src.Core.Contracts.ApplicationService.Commands.ICommandDispatcher>();
                    var persist = await commandDispatcher.Send<SetRoomUserBlockedCommand, string>(new SetRoomUserBlockedCommand
                    {
                        RoomId = kickRoomId,
                        RoomUserId = seatToBlock,
                        Blocked = true
                    });
                    if (persist.Status != ApplicationServiceStatus.Ok)
                        Log.Warning("Persist seat block rejected for seat {SeatId} room {RoomId}: {Status}", seatToBlock,
                            kickRoomId, persist.Status);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Could not persist block for seat {SeatId} in room {RoomId}", seatToBlock, kickRoomId);
                }
            }
            if (targetResolved)
                await Clients.Client(resolvedConnectionId).SendAsync("KickedFromMeeting", meetingId, blockUserName);

            ConnectionRegistry.TryRemove(resolvedConnectionId, out _);
            await LeaveMeetingFromRegistry(meetingId, targetName, targetIsHost, resolvedConnectionId, notifyHostDeparture: true);
        }

        public async Task SetParticipantRole(string meetingId, string targetConnectionId, string role, string? targetUserName = null)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canModRole) || !canModRole || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can change roles.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            // Same stale-roster tolerance as KickParticipant: resolve by name when the
            // connection id was superseded by a reconnect.
            if (!TryResolveMeetingParticipant(meetingId, targetConnectionId, targetUserName, out var resolvedRoleConnectionId, out _))
                throw new HubException("Participant not found.");
            targetConnectionId = resolvedRoleConnectionId;

            role = (role ?? "participant").Trim().ToLowerInvariant();
            if (role != "participant" && role != "presenter")
                role = "participant";

            // Persist granular grants so media hub calls (mic, camera, screen share) can be
            // authorized server-side. 'presenter' role = all three grants; 'participant' = none.
            var grantFlags = role == "presenter"
                ? (byte)(GrantVoice | GrantVideo | GrantPresenter)
                : (byte)0;
            var grantStore = MeetingPresenterGrants.GetOrAdd(
                meetingId,
                _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
            if (grantFlags != 0)
                grantStore[targetConnectionId] = grantFlags;
            else
                grantStore.TryRemove(targetConnectionId, out _);

            var voiceGranted = (grantFlags & GrantVoice) != 0;
            var videoGranted = (grantFlags & GrantVideo) != 0;
            var presenterGranted = (grantFlags & GrantPresenter) != 0;

            await Clients.Client(targetConnectionId).SendAsync("YourRoleChanged", role);
            await Clients.Client(targetConnectionId).SendAsync(
                "YourGrantsChanged", voiceGranted, videoGranted, presenterGranted);
            await Clients.Group(meetingId).SendAsync("ParticipantRoleChanged", targetConnectionId, role);
            await Clients.Group(meetingId).SendAsync(
                "ParticipantGrantsChanged", targetConnectionId, voiceGranted, videoGranted, presenterGranted);
        }

        /// <summary>
        /// Host sets granular permissions for one participant: voice (mic), video (camera)
        /// and presenter (screen share). Revoking presenter while sharing force-stops the
        /// share; revoking voice force-mutes; revoking video force-disables the camera.
        /// </summary>
        public async Task SetParticipantGrants(
            string meetingId,
            string targetConnectionId,
            bool voice,
            bool video,
            bool presenter,
            string? targetUserName = null)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canModGrants) ||
                !canModGrants || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can change permissions.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            // Stale-roster tolerance, same as KickParticipant / SetParticipantRole.
            if (!TryResolveMeetingParticipant(meetingId, targetConnectionId, targetUserName, out var resolvedId, out _))
                throw new HubException("Participant not found.");
            targetConnectionId = resolvedId;

            if (ConnectionRegistry.TryGetValue(targetConnectionId, out var targetInfo) && targetInfo.CanModerate)
            {
                // Hosts/moderators always hold every permission; grants do not apply.
                voice = video = presenter = true;
            }

            var flags = (byte)((voice ? GrantVoice : 0) | (video ? GrantVideo : 0) | (presenter ? GrantPresenter : 0));
            var grantStore = MeetingPresenterGrants.GetOrAdd(
                meetingId,
                _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
            if (flags != 0)
                grantStore[targetConnectionId] = flags;
            else
                grantStore.TryRemove(targetConnectionId, out _);

            // Presenter revoked while this participant is sharing: stop the share instantly.
            if (!presenter &&
                MeetingActiveScreenSharers.TryGetValue(meetingId, out var activeSharers) &&
                activeSharers.TryRemove(targetConnectionId, out _))
            {
                await Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", targetConnectionId);
            }

            // Voice revoked: force-mute so the student's mic icon flips immediately.
            if (!voice)
            {
                await Clients.Client(targetConnectionId).SendAsync("RemoteMicSet", true);
                await Clients.Group(meetingId).SendAsync("ParticipantMuted", targetConnectionId, true);
            }

            // Video revoked: force-disable the camera tile.
            if (!video)
            {
                await Clients.Group(meetingId).SendAsync("ParticipantVideoToggled", targetConnectionId, false);
            }

            await Clients.Client(targetConnectionId).SendAsync("YourGrantsChanged", voice, video, presenter);
            await Clients.Group(meetingId).SendAsync(
                "ParticipantGrantsChanged", targetConnectionId, voice, video, presenter);
        }

        /// <summary>Host forces mute state on a participant's client (that client applies it to the local mic).</summary>
        public async Task SetRemoteMic(string meetingId, string targetConnectionId, bool muted)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canModMic) || !canModMic || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can change participant microphone.");

            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var target) || target.MeetingId != meetingId)
                throw new HubException("The target is not in this meeting.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            await Clients.Client(targetConnectionId).SendAsync("RemoteMicSet", muted);
            await Clients.Group(meetingId).SendAsync("ParticipantMuted", targetConnectionId, muted);
        }

        /// <summary>Host asks a student to grant microphone access (student must confirm on their client).</summary>
        public async Task RequestMicPermission(string meetingId, string targetConnectionId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out var callerName, out var canModMic) || !canModMic || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can request participant microphone.");

            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var target) || target.MeetingId != meetingId)
                throw new HubException("The target is not in this meeting.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var targetInfo) || targetInfo.MeetingId != meetingId)
                throw new HubException("Participant not found.");

            await Clients.Client(targetConnectionId).SendAsync("MicPermissionRequested", Context.ConnectionId, callerName);
        }

        /// <summary>Student accepts or declines a host microphone request.</summary>
        public async Task RespondMicPermission(string meetingId, string requesterConnectionId, bool accepted)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                throw new HubException("Not in this meeting.");

            if (string.IsNullOrWhiteSpace(requesterConnectionId))
                throw new HubException("Invalid requester.");

            var studentConnectionId = Context.ConnectionId;
            await Clients.Client(requesterConnectionId).SendAsync("MicPermissionResponded", studentConnectionId, accepted);

            if (accepted)
            {
                // Accepted mic requests persist as a voice grant so the student can
                // re-mute / un-mute themselves without a new request.
                var grantStore = MeetingPresenterGrants.GetOrAdd(
                    meetingId,
                    _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
                grantStore.AddOrUpdate(
                    studentConnectionId,
                    GrantVoice,
                    (_, existing) => (byte)(existing | GrantVoice));

                await Clients.Group(meetingId).SendAsync("ParticipantMuted", studentConnectionId, false);
                await Clients.Client(studentConnectionId).SendAsync("YourGrantsChanged", true,
                    IsVideoGranted(meetingId, studentConnectionId),
                    IsGrantedPresenter(meetingId, studentConnectionId));
                await Clients.Group(meetingId).SendAsync("ParticipantGrantsChanged", studentConnectionId,
                    true, IsVideoGranted(meetingId, studentConnectionId),
                    IsGrantedPresenter(meetingId, studentConnectionId));
            }
        }

        public async Task SendFile(string meetingId, string userName, string fileName, byte[] fileData)
        {
            userName = RequireMainRoomMember(meetingId);
            try
            {
                Log.Information($"📁 {userName} is sending file {fileName} in meeting {meetingId}");
                await Clients.Group(meetingId).SendAsync("ReceiveFile", userName, fileName, fileData);
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in SendFile: {ex.Message}");
            }
        }

        public async Task StartStreaming(string meetingId, string userName)
        {
            userName = RequireMainRoomMember(meetingId);
            try
            {
                if (!UserStreams.ContainsKey(Context.ConnectionId))
                {
                    UserStreams[Context.ConnectionId] = userName;
                    await Clients.OthersInGroup(meetingId).SendAsync("UserStartedStreaming", userName);
                    Log.Information($"🎥 {userName} started streaming in {meetingId}");
                }
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in StartStreaming: {ex.Message}");
            }
        }

        public async Task StopStreaming(string meetingId, string userName)
        {
            userName = RequireMainRoomMember(meetingId);
            try
            {
                if (UserStreams.TryRemove(Context.ConnectionId, out _))
                {
                    await Clients.OthersInGroup(meetingId).SendAsync("UserStoppedStreaming", userName);
                    Log.Information($"❌ {userName} stopped streaming in {meetingId}");
                }
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in StopStreaming: {ex.Message}");
            }
        }

        public async Task ToggleMute(string meetingId, string participantId, bool isMuted)
        {
            try
            {
                if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                    return;

                var cid = Context.ConnectionId;
                if (!string.Equals(participantId, cid, StringComparison.Ordinal))
                    return;

                if (!isMuted &&
                    ConnectionRegistry.TryGetValue(cid, out var micCaller) &&
                    !micCaller.CanModerate &&
                    !IsVoiceGranted(meetingId, cid))
                    return;

                Log.Information($"🔇 {participantId} changed microphone status in {meetingId}");
                await Clients.Group(meetingId).SendAsync("ParticipantMuted", participantId, isMuted);
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in ToggleMute: {ex.Message}");
            }
        }

        /// <summary>Publisher broadcasts current mic + camera flags so late joiners sync UI state.</summary>
        public async Task BroadcastMediaState(string meetingId, bool isMicMuted, bool isVideoOn)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                return;

            var cid = Context.ConnectionId;
            if (ConnectionRegistry.TryGetValue(cid, out var mediaCaller) && !mediaCaller.CanModerate)
            {
                if (!IsVoiceGranted(meetingId, cid)) isMicMuted = true;
                if (!IsVideoGranted(meetingId, cid)) isVideoOn = false;
            }
            await Clients.Group(meetingId).SendAsync("ParticipantMuted", cid, isMicMuted);
            await Clients.Group(meetingId).SendAsync("ParticipantVideoToggled", cid, isVideoOn);
        }

        /// <summary>Joiner asks existing peers to rebroadcast their media flags.</summary>
        public async Task RequestMediaStateSync(string meetingId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                return;

            await Clients.OthersInGroup(meetingId).SendAsync("ResyncMediaStateRequested");

            if (MeetingWebcamOverlays.TryGetValue(meetingId, out var overlays))
            {
                foreach (var (publisherId, overlay) in overlays)
                {
                    await Clients.Caller.SendAsync(
                        "WebcamOverlayUpdated",
                        overlay.X,
                        overlay.Y,
                        overlay.Width,
                        overlay.Height,
                        overlay.StyleJson,
                        publisherId);
                }
            }

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var sharers))
            {
                foreach (var sharerId in sharers.Keys)
                    await Clients.Caller.SendAsync("ParticipantScreenShared", sharerId);
            }

            if (MeetingRaisedHands.TryGetValue(meetingId, out var hands))
            {
                foreach (var handId in hands.Keys)
                    await Clients.Caller.SendAsync("HandRaised", handId);
            }
        }

        public async Task ToggleVideo(string meetingId, string participantId, bool isVideoOn)
        {
            try
            {
                if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                    return;

                var cid = Context.ConnectionId;
                if (!string.Equals(participantId, cid, StringComparison.Ordinal))
                    return;


                if (isVideoOn &&
                    ConnectionRegistry.TryGetValue(cid, out var videoCaller) &&
                    !videoCaller.CanModerate &&
                    !IsVideoGranted(meetingId, cid))
                    return;

                Log.Information($"📹 {participantId} changed video status in {meetingId}");
                await Clients.Group(meetingId).SendAsync("ParticipantVideoToggled", participantId, isVideoOn);
            }
            catch (Exception ex)
            {
                Log.Error($"❌ Error in ToggleVideo: {ex.Message}");
            }
        }

        /// <summary>
        /// The caller must be a host/moderator or a granted presenter. Small mesh rooms may
        /// display several independent screen tiles up to MaxConcurrentScreenShares.
        /// </summary>
        public async Task StartScreenShare(string meetingId, string participantId)
        {
            RequireMainRoomMember(meetingId);
            var callerId = Context.ConnectionId;

            if (string.IsNullOrWhiteSpace(meetingId) || string.IsNullOrWhiteSpace(participantId))
                throw new HubException("Invalid screen share request.");

            if (!string.Equals(participantId, callerId, StringComparison.Ordinal))
                throw new HubException("Screen share must be started by the sharing participant.");

            if (!ConnectionRegistry.TryGetValue(callerId, out var callerInfo) || callerInfo.MeetingId != meetingId)
                throw new HubException("Not in this meeting.");

            if (!callerInfo.CanModerate && !IsGrantedPresenter(meetingId, callerId))
            {
                await Clients.Caller.SendAsync("ScreenShareDenied", string.Empty);
                throw new HubException("Only the teacher or a participant granted presenter can share the screen.");
            }

            var set = MeetingActiveScreenSharers.GetOrAdd(
                meetingId,
                _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));

            var reachedShareLimit = false;
            lock (set)
            {
                reachedShareLimit = !set.ContainsKey(callerId) && set.Count >= MaxConcurrentScreenShares;
                if (!reachedShareLimit)
                    set[callerId] = 0;
            }

            if (reachedShareLimit)
            {
                await Clients.Caller.SendAsync("ScreenShareDenied", set.Keys.FirstOrDefault() ?? string.Empty);
                throw new HubException($"A meeting supports at most {MaxConcurrentScreenShares} simultaneous screen shares.");
            }

            Log.Information($"🖥 {callerId} started screen sharing in {meetingId}");
            await Clients.Group(meetingId).SendAsync("ParticipantScreenShared", callerId);
        }

        public async Task StopScreenShare(string meetingId, string participantId)
        {
            RequireMainRoomMember(meetingId);
            var callerId = Context.ConnectionId;

            if (!string.Equals(participantId, callerId, StringComparison.Ordinal) &&
                (!TryGetCallerMeeting(out var myMeetingId, out _, out var canModStop) ||
                 !canModStop ||
                 myMeetingId != meetingId))
            {
                throw new HubException("Only the sharing participant or the meeting host can stop a screen share.");
            }

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var set))
                set.TryRemove(participantId, out _);

            Log.Information($"⛔ {participantId} stopped screen sharing in {meetingId}");
            await Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", participantId);
        }

        /// <summary>Moderator stops another participant's screen share.</summary>
        public async Task ForceStopScreenShare(string meetingId, string targetConnectionId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canModShare) || !canModShare || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can stop screen sharing.");

            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var target) || target.MeetingId != meetingId)
                throw new HubException("The target is not in this meeting.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var set))
                set.TryRemove(targetConnectionId, out _);

            await Clients.Client(targetConnectionId).SendAsync("RemoteScreenShareStop");
            await Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", targetConnectionId);
        }

        /// <summary>Publisher broadcasts webcam overlay position/size (+ optional style JSON) so viewers mirror layout.</summary>
        public async Task UpdateWebcamOverlay(
            string meetingId,
            double x,
            double y,
            double width,
            double height,
            string? styleJson = null)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                return;

            var publisherId = Context.ConnectionId;
            var map = MeetingWebcamOverlays.GetOrAdd(
                meetingId,
                _ => new ConcurrentDictionary<string, WebcamOverlayState>(StringComparer.Ordinal));
            map[publisherId] = new WebcamOverlayState(x, y, width, height, styleJson);
            await Clients.OthersInGroup(meetingId)
                .SendAsync("WebcamOverlayUpdated", x, y, width, height, styleJson, publisherId);
        }

        public async Task RaiseHand(string meetingId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                return;

            var cid = Context.ConnectionId;
            var hands = MeetingRaisedHands.GetOrAdd(
                meetingId,
                _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
            hands[cid] = 0;
            await Clients.Group(meetingId).SendAsync("HandRaised", cid);
        }

        public async Task LowerHand(string meetingId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out _) || myMeetingId != meetingId)
                return;

            var cid = Context.ConnectionId;
            if (MeetingRaisedHands.TryGetValue(meetingId, out var hands))
                hands.TryRemove(cid, out _);
            await Clients.Group(meetingId).SendAsync("HandLowered", cid);
        }

        /// <summary>Moderator lowers another participant's raised hand.</summary>
        public async Task LowerParticipantHand(string meetingId, string targetConnectionId)
        {
            if (!TryGetCallerMeeting(out var myMeetingId, out _, out var canMod) || !canMod || myMeetingId != meetingId)
                throw new HubException("Only the meeting host can lower hands.");

            if (!ConnectionRegistry.TryGetValue(targetConnectionId, out var target) || target.MeetingId != meetingId)
                throw new HubException("The target is not in this meeting.");

            if (string.IsNullOrWhiteSpace(targetConnectionId))
                throw new HubException("Invalid target.");

            if (MeetingRaisedHands.TryGetValue(meetingId, out var hands))
                hands.TryRemove(targetConnectionId, out _);
            await Clients.Group(meetingId).SendAsync("HandLowered", targetConnectionId);
        }

        /// <summary>پس از بررسی عضویت و مجوز مدیریت، پایان جلسه را زیر قفل اتاق به سرویس چرخه جلسه واگذار می‌کند.</summary>
        /// <remarks>سرویس پایان جلسه رجیستری اعضا را پاک می‌کند؛ پیام خروج بعدی کلاینت ممکن است دیگر عضوی پیدا نکند.</remarks>
        public async Task EndMeeting(string meetingId)
        {
            RequireMainRoomMember(meetingId);
            if (!TryGetCallerMeeting(out _, out _, out var canModerate) || !canModerate)
                throw new HubException("Only meeting staff can end the meeting.");
            using var transition = await roomCoordinator.EnterAsync(meetingId);
            roomCoordinator.CancelHostDeparture(meetingId);
            await meetingLifecycle.EndRoomMeetingAsync(long.Parse(meetingId), "host_ended");
        }

        /// <summary>عضویت اتصال قطع‌شده را در صورت وجود پاک می‌کند و برای خروج میزبان امکان بازگشت را لحاظ می‌کند.</summary>
        /// <remarks>برخلاف LeaveMeeting، نبود عضویت در این مسیر خطا نیست.</remarks>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                if (ConnectionRegistry.TryGetValue(Context.ConnectionId, out var info))
                {
                    using var transition = await roomCoordinator.EnterAsync(info.MeetingId);
                    if (ConnectionRegistry.TryRemove(Context.ConnectionId, out info))
                        await LeaveMeetingFromRegistry(info.MeetingId, info.UserName, info.IsHost,
                            Context.ConnectionId, notifyHostDeparture: true, allowReconnect: true);
                }
            }
            finally { await base.OnDisconnectedAsync(exception); }
        }

        private async Task MarkRoomSeatOnlineAsync(long roomId, long seatUserId)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var commandDispatcher = scope.ServiceProvider.GetRequiredService<Framework.Src.Core.Contracts.ApplicationService.Commands.ICommandDispatcher>();
                await commandDispatcher.Send<UpdateUserStatusCommand, bool>(new UpdateUserStatusCommand
                {
                    RoomId = roomId,
                    UserId = seatUserId,
                    IsOnline = true
                });
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Could not mark seat {SeatId} online for room {RoomId}", seatUserId, roomId);
            }
        }

        private async Task ReleaseRoomSeatOnlineAsync(long roomId, long seatUserId)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var commandDispatcher = scope.ServiceProvider.GetRequiredService<Framework.Src.Core.Contracts.ApplicationService.Commands.ICommandDispatcher>();
                await commandDispatcher.Send<UpdateUserStatusCommand, bool>(new UpdateUserStatusCommand
                {
                    RoomId = roomId,
                    UserId = seatUserId,
                    IsOnline = false
                });
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Could not release seat {SeatId} for room {RoomId}", seatUserId, roomId);
            }
        }

        private async Task UnregisterLiveSessionAsync(string meetingId, string userName, string connectionId)
        {
            if (TryGetRoomSeatJoinContext(meetingId, userName, out var roomId, out var seatUserId))
            {
                if (roomSeatLivePresence.TryGetSeatConnection(roomId, seatUserId, out var current) && current == connectionId)
                {
                    roomSeatLivePresence.UnregisterSeat(roomId, seatUserId, connectionId);
                    if (!roomSeatLivePresence.IsSeatLive(roomId, seatUserId))
                        await ReleaseRoomSeatOnlineAsync(roomId, seatUserId);
                }
                return;
            }

            try
            {
                using var doc = JsonDocument.Parse(userName ?? "{}");
                if (doc.RootElement.TryGetProperty("id", out var idEl))
                {
                    var staffId = idEl.GetString();
                    if (!string.IsNullOrWhiteSpace(staffId) &&
                        RoomStaffLiveConnections.TryGetValue(meetingId, out var staffMap) &&
                        staffMap.TryGetValue(staffId, out var conn) &&
                        conn == connectionId)
                    {
                        staffMap.TryRemove(staffId, out _);
                    }
                }
            }
            catch
            {
                /* ignore */
            }
        }

        private async Task LeaveMeetingFromRegistry(
            string meetingId,
            string userName,
            bool isHostTeacher,
            string connectionId,
            bool notifyHostDeparture = false,
            bool allowReconnect = false)
        {
            Log.Information($"⚠️ Connection {connectionId} disconnected from {meetingId}");

            await UnregisterLiveSessionAsync(meetingId, userName, connectionId);
            UserStreams.TryRemove(connectionId, out _);

            await Groups.RemoveFromGroupAsync(connectionId, meetingId);
            await Groups.RemoveFromGroupAsync(connectionId, WaitingGroup(meetingId));

            if (MeetingParticipants.ContainsKey(meetingId))
            {
                MeetingParticipants[meetingId].Remove(userName);
                if (MeetingParticipants[meetingId].Count == 0)
                    MeetingParticipants.TryRemove(meetingId, out _);
            }

            if (MeetingConnections.TryGetValue(meetingId, out var dial))
            {
                dial.TryRemove(connectionId, out _);
                if (dial.Count == 0)
                    MeetingConnections.TryRemove(meetingId, out _);
            }

            if (WaitingByMeeting.TryGetValue(meetingId, out var w))
                w.TryRemove(connectionId, out _);

            await Clients.Group(meetingId).SendAsync("UserLeft", userName, connectionId);

            if (MeetingActiveScreenSharers.TryGetValue(meetingId, out var leaveSharers) &&
                leaveSharers.TryRemove(connectionId, out _))
            {
                await Clients.Group(meetingId).SendAsync("ParticipantScreenShareStopped", connectionId);
            }

            if (MeetingPresenterGrants.TryGetValue(meetingId, out var leaveGrants))
                leaveGrants.TryRemove(connectionId, out _);

            if (MeetingRaisedHands.TryGetValue(meetingId, out var leaveHands) &&
                leaveHands.TryRemove(connectionId, out _))
            {
                await Clients.Group(meetingId).SendAsync("HandLowered", connectionId);
            }

            if (MeetingWebcamOverlays.TryGetValue(meetingId, out var leaveOverlays))
                leaveOverlays.TryRemove(connectionId, out _);

            if (notifyHostDeparture)
                await HandleHostDepartureAsync(meetingId, isHostTeacher, allowReconnect);
        }
    }
}
