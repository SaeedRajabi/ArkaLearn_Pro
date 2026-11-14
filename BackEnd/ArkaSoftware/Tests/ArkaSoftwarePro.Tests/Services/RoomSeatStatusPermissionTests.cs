using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LogoutUserFromRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus;
using Framework.Src.Core.RequestResponse.Common;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class RoomSeatStatusPermissionTests
{
    [Theory]
    [InlineData(42, false)]
    [InlineData(43, true)]
    public async Task SeatStatusChangesRequireManagementForOtherSeats(long target, bool managementRequired)
    {
        var (context, access) = Services();
        var repository = new Mock<IRoomCommandRepository>();
        var handler = new UpdateUserStatusCommandHandler(null!, repository.Object, Mock.Of<IChatMessageHub>(),
            Mock.Of<IRoomSeatLivePresence>(), Mock.Of<IRoomSeatAdminNotifier>(), context, access.Object);
        var result = await handler.Handle(new UpdateUserStatusCommand { RoomId = 100, UserId = target, IsOnline = false });
        Assert.Equal(managementRequired ? ApplicationServiceStatus.ValidationError : ApplicationServiceStatus.NotFound, result.Status);
        access.Verify(a => a.CanAccessAsync(100, context.HttpContext!.User, managementRequired, default), Times.Once);
        repository.Verify(r => r.GetGraphAsync(100), managementRequired ? Times.Never() : Times.Once());
        repository.Verify(r => r.CommitAsync(), Times.Never);
    }

    [Theory]
    [InlineData(42, false)]
    [InlineData(43, true)]
    public async Task LoggingOutAnotherSeatRequiresManagementBeforeAnyDataIsLoaded(long target, bool managementRequired)
    {
        var (context, access) = Services();
        var repository = new Mock<IRoomCommandRepository>();
        var handler = new LogoutUserFromRoomCommandHandler(null!, context, repository.Object, Mock.Of<IChatMessageHub>(), access.Object);
        var result = await handler.Handle(new LogoutUserFromRoomCommand { RoomId = 100, UserId = target });
        Assert.Equal(managementRequired ? ApplicationServiceStatus.ValidationError : ApplicationServiceStatus.NotFound, result.Status);
        access.Verify(a => a.CanAccessAsync(100, context.HttpContext!.User, managementRequired, default), Times.Once);
        repository.Verify(r => r.GetGraphAsync(100), managementRequired ? Times.Never() : Times.Once());
        repository.Verify(r => r.CommitAsync(), Times.Never);
    }

    private static (IHttpContextAccessor Context, Mock<IRoomAccessService> Access) Services()
    {
        var context = new HttpContextAccessor { HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([
                new Claim("identityScope", "room-seat"), new Claim("roomSeatId", "42"), new Claim("roomId", "100")], "test"))
        }};
        var access = new Mock<IRoomAccessService>();
        access.Setup(a => a.CanAccessAsync(100, context.HttpContext.User, false, default)).ReturnsAsync(true);
        return (context, access);
    }
}
