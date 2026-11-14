using ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;

public interface IRoomSessionCommandRepository : ICommandRepository<RoomSession, long>
{
    Task<RoomSession?> GetActiveSessionForRoomAsync(long roomId);
    Task<RoomSession?> GetSessionByIdAsync(long sessionId, long roomId);
    Task DeleteSessionAsync(RoomSession session);
}