using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using FluentAssertions;
using Xunit;

namespace ArkaSoftwarePro.Tests.Domain;

public class RoomTests
{
    [Fact]
    public void AddUserRoom_ShouldAddUserToRoom()
    {
        // Arrange
        var room = new Room("Test Room", 10, "http://localhost", "test-room", false, 0, false, false, 60, StatusType.Active, 1);

        // Act
        room.AddUserRoom("John", "Doe", "johndoe", "password");

        // Assert
        room.RoomUsers.Should().HaveCount(1);
        var user = room.RoomUsers.First();
        user.Name.FirstName.Should().Be("John");
        user.Name.LastName.Should().Be("Doe");
        user.UserName.Value.Should().Be("johndoe");
    }

    [Fact]
    public void LoginIntoRoom_WithValidCredentials_ShouldNotThrowException()
    {
        // Arrange
        var room = new Room("Test Room", 10, "http://localhost", "test-room", false, 0, false, false, 60, StatusType.Active, 1);
        room.AddUserRoom("John", "Doe", "johndoe", "password");

        // Act
        var act = () => room.LoginIntoRoom("johndoe", "password");

        // Assert
        act.Should().NotThrow();
    }

    [Fact]
    public void SetRoomSeatBlocked_ShouldBlockUser()
    {
        // Arrange
        var room = new Room("Test Room", 10, "http://localhost", "test-room", false, 0, false, false, 60, StatusType.Active, 1);
        room.AddUserRoom("John", "Doe", "johndoe", "password");
        var user = room.RoomUsers.First();

        // Act
        room.SetRoomSeatBlocked(user.Id, true);

        // Assert
        user.IsBlocked.Should().BeTrue();
    }
}
