using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;

namespace ArkaSoftwarePro.Tests.Hubs;

public sealed class ChatHubSecurityTests : IAsyncLifetime
{
    private readonly Mock<IRoomAccessService> access = new();
    private readonly Mock<IClientProxy> recipients = new();
    private readonly Mock<IGroupManager> groups = new();
    private readonly ChatHub hub;

    public ChatHubSecurityTests()
    {
        var context = new Mock<HubCallerContext>();
        context.SetupGet(c => c.ConnectionId).Returns(Guid.NewGuid().ToString("N"));
        context.SetupGet(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity([new Claim("userId", "42")], "test")));
        var clients = new Mock<IHubCallerClients>();
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(recipients.Object);
        clients.Setup(c => c.GroupExcept(It.IsAny<string>(), It.IsAny<IReadOnlyList<string>>())).Returns(recipients.Object);
        recipients.Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        access.Setup(a => a.CanAccessAsync(It.IsAny<long>(), It.IsAny<ClaimsPrincipal>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((long room, ClaimsPrincipal _, bool manage, CancellationToken _) => room == 100 && !manage);
        hub = new ChatHub(access.Object) { Context = context.Object, Clients = clients.Object, Groups = groups.Object };
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => hub.OnDisconnectedAsync(null);

    [Fact]
    public async Task UnauthorizedRoomCannotBeJoinedOrReceiveSignals()
    {
        await Assert.ThrowsAsync<HubException>(() => hub.JoinRoom("200"));
        groups.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        await hub.JoinRoom("100");
        await Assert.ThrowsAsync<HubException>(() => hub.SendMediaSignal("200", "42", new { type = "offer" }));
        recipients.Verify(c => c.SendCoreAsync("ReceiveMediaSignal", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MembershipAndCurrentPermissionAreBothRequiredToPublish()
    {
        await Assert.ThrowsAsync<HubException>(() => hub.SendMediaSignal("100", "42", new { type = "offer" }));
        await hub.JoinRoom("100");
        access.Setup(a => a.CanAccessAsync(100, It.IsAny<ClaimsPrincipal>(), false, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        await Assert.ThrowsAsync<HubException>(() => hub.SendMediaSignal("100", "42", new { type = "offer" }));
        recipients.Verify(c => c.SendCoreAsync("ReceiveMediaSignal", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RoomParticipantCannotGrantRolesOrKickOthers()
    {
        await hub.JoinRoom("100");
        await Assert.ThrowsAsync<HubException>(() => hub.KickUser("100", "43"));
        await Assert.ThrowsAsync<HubException>(() => hub.ChangeUserRole("100", "42", "presenter"));
        groups.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PublishedSignalUsesAuthenticatedSender()
    {
        await hub.JoinRoom("100");
        await hub.SendMediaSignal("100", "forged-admin", new { type = "offer" });
        recipients.Verify(c => c.SendCoreAsync("ReceiveMediaSignal", It.Is<object[]>(args =>
            (string)args[0].GetType().GetProperty("fromUserId")!.GetValue(args[0])! == "42"), It.IsAny<CancellationToken>()), Times.Once);
    }
}
