using System.Security.Cryptography;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class RoomJoinTicketSecurityTests
{
    [Fact]
    public void TicketIsBoundToRoomAndCannotBeModified()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        { ["RoomJoinTicket:SigningKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)) }).Build();
        var service = new RoomJoinTicketService(configuration);
        var ticket = service.CreateStudentTicket(10, 20);
        Assert.Equal(20, service.Validate(ticket, 10)!.SeatUserId);
        Assert.Null(service.Validate(ticket, 11));
        var tampered = (ticket[0] == 'A' ? "B" : "A") + ticket[1..];
        Assert.Null(service.Validate(tampered, 10));
    }
    [Fact]
    public void MissingSigningKeyCannotIssueTickets() => Assert.Throws<InvalidOperationException>(() =>
        new RoomJoinTicketService(new ConfigurationBuilder().Build()).CreateStudentTicket(10, 20));
}
