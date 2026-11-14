using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using FluentAssertions;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class RoomSeatLivePresenceTests
{
    [Fact]
    public void TakeOverSeat_WhenSeatEmpty_ReturnsNullAndRegisters()
    {
        var presence = new RoomSeatLivePresence();

        var previous = presence.TakeOverSeat(10, 20, "conn-1");

        previous.Should().BeNull();
        presence.IsSeatLive(10, 20).Should().BeTrue();
        presence.TryGetSeatConnection(10, 20, out var conn).Should().BeTrue();
        conn.Should().Be("conn-1");
    }

    [Fact]
    public void TakeOverSeat_WhenDifferentConnection_ReturnsPreviousAndReplaces()
    {
        var presence = new RoomSeatLivePresence();
        presence.TakeOverSeat(10, 20, "conn-old");

        var previous = presence.TakeOverSeat(10, 20, "conn-new");

        previous.Should().Be("conn-old");
        presence.TryGetSeatConnection(10, 20, out var conn).Should().BeTrue();
        conn.Should().Be("conn-new");
    }

    [Fact]
    public void RegisterSeat_StillDeniesSecondConnectionWithoutTakeover()
    {
        var presence = new RoomSeatLivePresence();
        presence.RegisterSeat(1, 2, "a").Should().BeTrue();
        presence.RegisterSeat(1, 2, "b").Should().BeFalse();
    }
}
