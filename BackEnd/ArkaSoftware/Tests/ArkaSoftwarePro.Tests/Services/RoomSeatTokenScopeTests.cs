using System.Security.Claims;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class RoomSeatTokenScopeTests
{
    [Theory]
    [InlineData("/api/Service/Payment/Start", false)]
    [InlineData("/api/Service/Account/ChangePassword", false)]
    [InlineData("/hubs/support-chat", false)]
    [InlineData("/api/Service/RoomAdmin", false)]
    [InlineData("/api/Service/Room/msg-search", true)]
    [InlineData("/api/Service/Account/UserRoomLogout", true)]
    [InlineData("/api/Service/Account/UserRoomLogoutAnything", false)]
    [InlineData("/api/Message/send", true)]
    [InlineData("/meetingHub/negotiate", true)]
    [InlineData("/hubs/chat", true)]
    public void SeatIdentityCannotBeReusedAsAnAccountIdentity(string path, bool allowed)
    {
        var seat = new ClaimsPrincipal(new ClaimsIdentity([
            new Claim("identityScope", "room-seat"), new Claim("userId", "42")], "test"));
        Assert.Equal(allowed, RoomSeatTokenScope.Allows(seat, new PathString(path)));
        var account = new ClaimsPrincipal(new ClaimsIdentity([new Claim("userId", "42")], "test"));
        Assert.True(RoomSeatTokenScope.Allows(account, new PathString(path)));
    }

    [Fact]
    public void PublishedRoomControllerRouteRemainsAccessibleToSeatTokens()
    {
        var route = typeof(ArkaSoftwarePro.Src.Endpoints.API.Controllers.RoomController)
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.RouteAttribute), true)
            .Cast<Microsoft.AspNetCore.Mvc.RouteAttribute>().Single().Template.Replace("[controller]", "Room");
        var seat = new ClaimsPrincipal(new ClaimsIdentity([new Claim("identityScope", "room-seat")], "test"));
        Assert.True(RoomSeatTokenScope.Allows(seat, new PathString("/" + route + "/msg-search")));
    }
}
