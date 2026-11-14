namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;

/// <summary>Resolved state of a catalog seat (<see cref="RoomUser"/>) for live session join/login checks.</summary>
public sealed record RoomSeatLiveGate(bool IsBlocked, bool IsOnline);
