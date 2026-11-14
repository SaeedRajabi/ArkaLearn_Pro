using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class RoomMeetingCoordinatorTests
{
    private sealed class Clock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }
    [Fact]
    public async Task HostHasReconnectWindowAndCanceledDepartureDoesNotEndRoom()
    {
        var lifecycle = new Mock<IMeetingLifecycleService>();
        lifecycle.Setup(s => s.EndRoomMeetingAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        using var provider = new ServiceCollection().AddSingleton(lifecycle.Object).BuildServiceProvider();
        var clock = new Clock();
        var coordinator = new RoomMeetingCoordinator(provider.GetRequiredService<IServiceScopeFactory>(), clock, NullLogger<RoomMeetingCoordinator>.Instance);
        coordinator.ScheduleHostDeparture("901");
        clock.Now += TimeSpan.FromSeconds(29);
        await coordinator.ProcessDueDeparturesAsync();
        lifecycle.Verify(s => s.EndRoomMeetingAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        coordinator.CancelHostDeparture("901");
        clock.Now += TimeSpan.FromSeconds(2);
        await coordinator.ProcessDueDeparturesAsync();
        lifecycle.Verify(s => s.EndRoomMeetingAsync(It.IsAny<long>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        coordinator.ScheduleHostDeparture("902");
        clock.Now += TimeSpan.FromSeconds(31);
        await coordinator.ProcessDueDeparturesAsync();
        await coordinator.ProcessDueDeparturesAsync();
        lifecycle.Verify(s => s.EndRoomMeetingAsync(902, "teacher_disconnected", It.IsAny<CancellationToken>()), Times.Once);
    }
    [Fact]
    public async Task FailedSessionEndRemainsPendingForRetry()
    {
        var lifecycle = new Mock<IMeetingLifecycleService>();
        lifecycle.SetupSequence(s => s.EndRoomMeetingAsync(903, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("temporary failure")).Returns(Task.CompletedTask);
        using var provider = new ServiceCollection().AddSingleton(lifecycle.Object).BuildServiceProvider();
        var clock = new Clock();
        var coordinator = new RoomMeetingCoordinator(provider.GetRequiredService<IServiceScopeFactory>(), clock, NullLogger<RoomMeetingCoordinator>.Instance);
        coordinator.ScheduleHostDeparture("903");
        clock.Now += TimeSpan.FromSeconds(31);
        await Assert.ThrowsAsync<InvalidOperationException>(() => coordinator.ProcessDueDeparturesAsync());
        await coordinator.ProcessDueDeparturesAsync();
        lifecycle.Verify(s => s.EndRoomMeetingAsync(903, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
