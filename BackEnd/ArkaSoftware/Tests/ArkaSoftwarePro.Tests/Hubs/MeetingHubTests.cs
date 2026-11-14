using System.Collections.Concurrent;
using System.Reflection;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.SetRoomUserBlocked;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using FluentAssertions;
using Framework.Src.Core.Contracts.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Commands;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace ArkaSoftwarePro.Tests.Hubs;

public class MeetingHubTests
{
    private readonly Mock<ICommandDispatcher> _commandDispatcherMock = new();
    private readonly Mock<IRoomCommandRepository> _roomRepositoryMock = new();
    private readonly Mock<IRoomSeatLivePresence> _roomSeatLivePresenceMock = new();
    private readonly Mock<IRoomJoinTicketService> _joinTicketServiceMock = new();
    private readonly Mock<IMeetingLifecycleService> _meetingLifecycleMock = new();

    private readonly Mock<IHubCallerClients> _clientsMock = new();
    private readonly Mock<ISingleClientProxy> _singleClientProxyMock = new();
    private readonly Mock<IClientProxy> _clientProxyMock = new();
    private readonly Mock<IClientProxy> _othersInGroupProxyMock = new();
    private readonly Mock<HubCallerContext> _contextMock = new();
    private readonly Mock<IGroupManager> _groupsMock = new();

    private readonly MeetingHub _hub;

    public MeetingHubTests()
    {
        var serviceProviderMock = new Mock<IServiceProvider>();
        var serviceScopeMock = new Mock<IServiceScope>();
        var serviceScopeFactoryMock = new Mock<IServiceScopeFactory>();

        serviceProviderMock.Setup(sp => sp.GetService(typeof(IServiceScopeFactory))).Returns(serviceScopeFactoryMock.Object);
        serviceScopeFactoryMock.Setup(f => f.CreateScope()).Returns(serviceScopeMock.Object);
        serviceScopeMock.Setup(s => s.ServiceProvider).Returns(serviceProviderMock.Object);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(ICommandDispatcher))).Returns(_commandDispatcherMock.Object);

        _hub = new MeetingHub(
            serviceProviderMock.Object,
            _roomRepositoryMock.Object,
            _roomSeatLivePresenceMock.Object,
            _joinTicketServiceMock.Object,
            _meetingLifecycleMock.Object,
            new ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.RoomMeetingCoordinator(
                serviceScopeFactoryMock.Object, TimeProvider.System,
                Microsoft.Extensions.Logging.Abstractions.NullLogger<ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.RoomMeetingCoordinator>.Instance))
        {
            Clients = _clientsMock.Object,
            Context = _contextMock.Object,
            Groups = _groupsMock.Object
        };

        _clientsMock.Setup(c => c.Client(It.IsAny<string>())).Returns(_singleClientProxyMock.Object);
        _clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        _clientsMock.Setup(c => c.OthersInGroup(It.IsAny<string>())).Returns(_othersInGroupProxyMock.Object);
        _clientsMock.Setup(c => c.Caller).Returns(_singleClientProxyMock.Object);
        _clientsMock.Setup(c => c.All).Returns(_clientProxyMock.Object);

        ClearStaticMeetingState();
    }

    private static void ClearStaticMeetingState()
    {
        MeetingHub.ClearMeetingState("100");
        MeetingHub.ClearMeetingState("200");
    }

    private void InjectConnectionRegistry(
        string connectionId,
        string meetingId,
        string userName,
        bool isHost,
        bool canModerate,
        RoomMeetingRole role,
        bool isGuest = false)
    {
        var registryField = typeof(MeetingHub).GetField("ConnectionRegistry", BindingFlags.NonPublic | BindingFlags.Static);
        var registry = registryField!.GetValue(null)!;

        var connInfoType = typeof(MeetingHub).GetNestedType("ConnInfo", BindingFlags.NonPublic);
        var connInfo = Activator.CreateInstance(connInfoType!, meetingId, userName, isHost, canModerate, role, isGuest);

        InjectMeetingConnection(meetingId, connectionId, userName);
        var indexer = registry.GetType().GetProperty("Item");
        indexer!.SetValue(registry, connInfo, new object[] { connectionId });
    }

    private void InjectMeetingConnection(string meetingId, string connectionId, string userName)
    {
        var field = typeof(MeetingHub).GetField("MeetingConnections", BindingFlags.NonPublic | BindingFlags.Static);
        var root = (ConcurrentDictionary<string, ConcurrentDictionary<string, string>>)field!.GetValue(null)!;
        var dial = root.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, string>());
        dial[connectionId] = userName;
    }

    private ConcurrentDictionary<string, string>? GetDial(string meetingId)
    {
        var field = typeof(MeetingHub).GetField("MeetingConnections", BindingFlags.NonPublic | BindingFlags.Static);
        var root = (ConcurrentDictionary<string, ConcurrentDictionary<string, string>>)field!.GetValue(null)!;
        return root.TryGetValue(meetingId, out var dial) ? dial : null;
    }

    [Fact]
    public async Task KickParticipant_WhenCallerIsModerator_ShouldSendKickedEventAndBlock()
    {
        var meetingId = "100";
        var hostConnectionId = "host-conn";
        var targetConnectionId = "target-conn";

        _contextMock.Setup(c => c.ConnectionId).Returns(hostConnectionId);

        InjectConnectionRegistry(hostConnectionId, meetingId, "HostUser", true, true, RoomMeetingRole.Teacher);
        InjectConnectionRegistry(targetConnectionId, meetingId, "TargetUser", false, false, RoomMeetingRole.Student);

        _commandDispatcherMock
            .Setup(d => d.Send<SetRoomUserBlockedCommand, string>(It.IsAny<SetRoomUserBlockedCommand>()))
            .ReturnsAsync(new CommandResult<string> { Status = ApplicationServiceStatus.Ok });

        await _hub.KickParticipant(meetingId, targetConnectionId, null, true);

        _clientsMock.Verify(c => c.Client(targetConnectionId), Times.Once);
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("KickedFromMeeting", It.Is<object[]>(args =>
            (string)args[0] == meetingId && (bool)args[1] == true), default), Times.Once);
    }

    [Fact]
    public async Task KickParticipant_WhenRosterConnectionIsAlreadyGone_ShouldBeIdempotent()
    {
        const string meetingId = "100";
        const string hostConnectionId = "host-conn";
        const string staleConnectionId = "student-old-conn";

        _contextMock.Setup(c => c.ConnectionId).Returns(hostConnectionId);
        InjectConnectionRegistry(hostConnectionId, meetingId, "HostUser", true, true, RoomMeetingRole.Teacher);

        var action = () => _hub.KickParticipant(meetingId, staleConnectionId, "Student User", false);

        await action.Should().NotThrowAsync();
        _clientsMock.Verify(c => c.Client(staleConnectionId), Times.Never);
        _clientProxyMock.Verify(p => p.SendCoreAsync("UserLeft", It.Is<object[]>(args =>
            (string)args[0] == "Student User" && (string)args[1] == staleConnectionId), default), Times.Once);
    }

    [Fact]
    public async Task ToggleMute_WhenCallerMutesSelf_ShouldBroadcastParticipantMuted()
    {
        var meetingId = "100";
        var hostConnectionId = "host-conn";

        _contextMock.Setup(c => c.ConnectionId).Returns(hostConnectionId);

        InjectConnectionRegistry(hostConnectionId, meetingId, "HostUser", true, true, RoomMeetingRole.Teacher);

        await _hub.ToggleMute(meetingId, hostConnectionId, true);

        _clientsMock.Verify(c => c.Group(meetingId), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantMuted", It.Is<object[]>(args =>
            (string)args[0] == hostConnectionId && (bool)args[1] == true), default), Times.Once);
    }

    [Fact]
    public async Task FileNotificationUsesRegisteredSenderAndOnlyOtherRoomMembers()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("student-files");
        InjectConnectionRegistry("student-files", "100", "Student", false, false, RoomMeetingRole.Student);
        await _hub.NotifyRoomFilesChanged("100");
        _clientsMock.Verify(c => c.OthersInGroup("100"), Times.Once);
        _othersInGroupProxyMock.Verify(p => p.SendCoreAsync("RoomFilesChanged", It.Is<object[]>(args =>
            (string)args[0] == "student-files" && (string)args[1] == "Student"), default), Times.Once);
        await Assert.ThrowsAsync<HubException>(() => _hub.NotifyRoomFilesChanged("200"));
    }

    [Fact]
    public async Task StudentCannotPublishMicOrCameraBeforePermissionIsGranted()
    {
        const string meetingId = "100";
        const string studentId = "student-conn";
        _contextMock.Setup(c => c.ConnectionId).Returns(studentId);
        InjectConnectionRegistry(studentId, meetingId, "Student", false, false, RoomMeetingRole.Student);

        await _hub.ToggleMute(meetingId, studentId, false);
        await _hub.ToggleVideo(meetingId, studentId, true);

        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantMuted", It.IsAny<object[]>(), default), Times.Never);
        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantVideoToggled", It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task AcceptedMicRequestAllowsStudentToPublishVoiceWithoutPresenterRole()
    {
        const string meetingId = "100";
        const string hostId = "host-conn";
        const string studentId = "student-conn";
        _contextMock.Setup(c => c.ConnectionId).Returns(studentId);
        InjectConnectionRegistry(hostId, meetingId, "Host", true, true, RoomMeetingRole.Teacher);
        InjectConnectionRegistry(studentId, meetingId, "Student", false, false, RoomMeetingRole.Student);

        await _hub.RespondMicPermission(meetingId, hostId, true);
        await _hub.ToggleMute(meetingId, studentId, false);

        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantMuted", It.Is<object[]>(args =>
            (string)args[0] == studentId && (bool)args[1] == false), default), Times.AtLeastOnce);
    }

    [Fact]
    public async Task SetParticipantRole_WhenCallerIsModerator_ShouldSendRoleChangedEvents()
    {
        var meetingId = "100";
        var hostConnectionId = "host-conn";
        var targetConnectionId = "target-conn";
        var newRole = "presenter";

        _contextMock.Setup(c => c.ConnectionId).Returns(hostConnectionId);

        InjectConnectionRegistry(hostConnectionId, meetingId, "HostUser", true, true, RoomMeetingRole.Teacher);
        InjectConnectionRegistry(targetConnectionId, meetingId, "TargetUser", false, false, RoomMeetingRole.Student);

        await _hub.SetParticipantRole(meetingId, targetConnectionId, newRole);

        _singleClientProxyMock.Verify(p => p.SendCoreAsync("YourRoleChanged", It.Is<object[]>(args =>
            (string)args[0] == newRole), default), Times.Once);

        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantRoleChanged", It.Is<object[]>(args =>
            (string)args[0] == targetConnectionId && (string)args[1] == newRole), default), Times.Once);
    }

    [Fact]
    public async Task StartScreenShare_AllowsSeveralGrantedPresentersWithoutStoppingExistingShare()
    {
        const string meetingId = "100";
        const string hostId = "host-conn";
        const string firstId = "presenter-1";
        const string secondId = "presenter-2";
        var callerId = hostId;
        _contextMock.Setup(c => c.ConnectionId).Returns(() => callerId);

        InjectConnectionRegistry(hostId, meetingId, "Host", true, true, RoomMeetingRole.Teacher);
        InjectConnectionRegistry(firstId, meetingId, "First", false, false, RoomMeetingRole.Student);
        InjectConnectionRegistry(secondId, meetingId, "Second", false, false, RoomMeetingRole.Student);

        await _hub.SetParticipantRole(meetingId, firstId, "presenter");
        await _hub.SetParticipantRole(meetingId, secondId, "presenter");
        callerId = firstId;
        await _hub.StartScreenShare(meetingId, firstId);
        callerId = secondId;
        await _hub.StartScreenShare(meetingId, secondId);

        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantScreenShared", It.IsAny<object[]>(), default), Times.Exactly(2));
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("RemoteScreenShareStop", It.IsAny<object[]>(), default), Times.Never);
        MeetingHub.MaxConcurrentScreenShares.Should().Be(4);
    }

    [Fact]
    public async Task StartScreenShare_RejectsFifthConcurrentPublisher()
    {
        const string meetingId = "100";
        const string hostId = "host-conn";
        var callerId = hostId;
        _contextMock.Setup(c => c.ConnectionId).Returns(() => callerId);
        InjectConnectionRegistry(hostId, meetingId, "Host", true, true, RoomMeetingRole.Teacher);

        var presenters = Enumerable.Range(1, 5).Select(index => $"presenter-{index}").ToArray();
        foreach (var presenterId in presenters)
        {
            InjectConnectionRegistry(presenterId, meetingId, presenterId, false, false, RoomMeetingRole.Student);
            await _hub.SetParticipantRole(meetingId, presenterId, "presenter");
        }

        foreach (var presenterId in presenters.Take(4))
        {
            callerId = presenterId;
            await _hub.StartScreenShare(meetingId, presenterId);
        }

        callerId = presenters[4];
        await Assert.ThrowsAsync<HubException>(() => _hub.StartScreenShare(meetingId, callerId));
        _clientProxyMock.Verify(p => p.SendCoreAsync("ParticipantScreenShared", It.IsAny<object[]>(), default), Times.Exactly(4));
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("ScreenShareDenied", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task JoinMeeting_WhenSameStaffIdentityRejoins_ShouldSupersedeOldConnection()
    {
        var meetingId = "200";
        var oldConn = "staff-old";
        var newConn = "staff-new";
        var displayName = """{"id":"42","name":"Teacher","avatar":"","roomSeatLogin":false}""";

        InjectMeetingConnection(meetingId, oldConn, displayName);
        InjectConnectionRegistry(oldConn, meetingId, displayName, true, true, RoomMeetingRole.Teacher);

        var staffField = typeof(MeetingHub).GetField("RoomStaffLiveConnections", BindingFlags.NonPublic | BindingFlags.Static);
        var staffRoot = (ConcurrentDictionary<string, ConcurrentDictionary<string, string>>)staffField!.GetValue(null)!;
        staffRoot.GetOrAdd(meetingId, _ => new ConcurrentDictionary<string, string>(StringComparer.Ordinal))["42"] = oldConn;

        _contextMock.Setup(c => c.ConnectionId).Returns(newConn);

        _joinTicketServiceMock
            .Setup(s => s.Validate(It.IsAny<string>(), 200L))
            .Returns(new RoomJoinTicketClaims
            {
                RoomId = 200,
                Role = RoomMeetingRole.Teacher,
                ParticipantKey = "staff:42",
                StaffUserId = 42,
                SeatUserId = null,
                ExpiresUtc = DateTime.UtcNow.AddHours(1),
            });

        _roomRepositoryMock
            .Setup(r => r.GetWithRoomUsersAsync(200L))
            .ReturnsAsync(new ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities.Room(
                "Test room", 20, "https://example.test", "test-room", false, 0, false, false, 120,
                ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations.StatusType.Active, 42));

        _commandDispatcherMock
            .Setup(d => d.Send<ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands.StartRoomSessionCommand, long>(
                It.IsAny<ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands.StartRoomSessionCommand>()))
            .ReturnsAsync(new CommandResult<long> { Status = ApplicationServiceStatus.Ok });

        await _hub.JoinMeeting(meetingId, displayName, true, false, "ticket");

        var dial = GetDial(meetingId);
        dial.Should().NotBeNull();
        dial!.ContainsKey(oldConn).Should().BeFalse();
        dial.ContainsKey(newConn).Should().BeTrue();
        dial.Count.Should().Be(1);

        _singleClientProxyMock.Verify(
            p => p.SendCoreAsync("SupersededByNewSession", It.Is<object[]>(args => (string)args[0] == meetingId), default),
            Times.AtLeastOnce);

        _clientProxyMock.Verify(
            p => p.SendCoreAsync("UserLeft", It.Is<object[]>(args => (string)args[1] == oldConn), default),
            Times.AtLeastOnce);
    }
    [Fact]
    public async Task MissingJoinTicketCannotJoinOrReadRoom()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("anonymous");
        await _hub.JoinMeeting("100", "{}", true, false);
        _roomRepositoryMock.Verify(r => r.GetWithRoomUsersAsync(It.IsAny<long>()), Times.Never);
        _groupsMock.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Fact]
    public async Task DisplayIdentityMustMatchSignedTicket()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("forged-identity");
        _joinTicketServiceMock.Setup(s => s.Validate("ticket", 100)).Returns(new RoomJoinTicketClaims
        {
            RoomId = 100, Role = RoomMeetingRole.Student, ParticipantKey = "seat:10", SeatUserId = 10,
            ExpiresUtc = DateTime.UtcNow.AddHours(1)
        });
        await _hub.JoinMeeting("100", """{"id":"999","name":"forged"}""", true, false, "ticket");
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("JoinDeniedInvalidTicket", It.IsAny<object[]>(), default), Times.Once);
        _roomRepositoryMock.Verify(r => r.GetWithRoomUsersAsync(It.IsAny<long>()), Times.Never);
    }

    [Fact]
    public async Task SignalCannotBeSentAcrossRooms()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("signal-source");
        InjectConnectionRegistry("signal-source", "100", "Student", false, false, RoomMeetingRole.Student);
        InjectConnectionRegistry("signal-target", "200", "Other", false, false, RoomMeetingRole.Student);
        await Assert.ThrowsAsync<HubException>(() => _hub.SendSignal("signal-target", "offer"));
        _singleClientProxyMock.Verify(p => p.SendCoreAsync("ReceiveSignal", It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task WaitingParticipantCannotPublishMessagesOrMedia()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("waiting-student");
        InjectConnectionRegistry("waiting-student", "100", "Student", false, false, RoomMeetingRole.Student);
        GetDial("100")!.TryRemove("waiting-student", out _);
        await Assert.ThrowsAsync<HubException>(() => _hub.SendMessage("100", "Teacher", "hello"));
        await Assert.ThrowsAsync<HubException>(() => _hub.StartScreenShare("100", "waiting-student"));
    }

    [Fact]
    public async Task MessageUsesRegisteredIdentityInsteadOfClientName()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("chat-student");
        InjectConnectionRegistry("chat-student", "100", "Actual Student", false, false, RoomMeetingRole.Student);
        await _hub.SendMessage("100", "Forged Teacher", "hello");
        _clientProxyMock.Verify(p => p.SendCoreAsync("ReceiveMessage", It.Is<object[]>(args =>
            (string)args[0] == "Actual Student" && (string)args[1] == "hello"), default), Times.Once);
    }

    [Fact]
    public async Task TeacherDisconnectDoesNotImmediatelyEndMeeting()
    {
        _contextMock.Setup(c => c.ConnectionId).Returns("transient-host");
        InjectConnectionRegistry("transient-host", "100", "Teacher", true, true, RoomMeetingRole.Teacher);
        await _hub.OnDisconnectedAsync(null);
        _meetingLifecycleMock.Verify(s => s.EndRoomMeetingAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.False(MeetingHub.HasActiveHost("100"));
    }

}
