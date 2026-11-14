using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Sessions.Repositories;

public class RoomSessionCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<RoomSession, ArkaSoftwareCommandDbContext>(dbContext), IRoomSessionCommandRepository
{
    public async Task<RoomSession?> GetActiveSessionForRoomAsync(long roomId)
    {
        return await dbContext.Set<RoomSession>()
            .FirstOrDefaultAsync(x => x.RoomId == roomId && x.Status == "Active");
    }

    public Task<RoomSession?> GetSessionByIdAsync(long sessionId, long roomId) =>
        dbContext.Set<RoomSession>()
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.RoomId == roomId);

    public Task DeleteSessionAsync(RoomSession session)
    {
        dbContext.Set<RoomSession>().Remove(session);
        return Task.CompletedTask;
    }
}