using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;

public interface IRemoteAssistCommandRepository : ICommandRepository<RemoteAssistSession, long>
{
    Task<RemoteAssistSession?> GetByIdAsync(long sessionId, CancellationToken cancellationToken = default);
    Task<RemoteAssistSession?> GetByCodeAsync(string oneTimeSessionCode, CancellationToken cancellationToken = default);
    Task<RemoteAssistSession?> GetOpenByCodeAsync(string oneTimeSessionCode, CancellationToken cancellationToken = default);
    Task<RemoteAssistSession?> GetOpenSessionForUserAsync(long userId, CancellationToken cancellationToken = default);
    Task<RemoteAssistSession?> GetOpenSessionForOwnerAsync(long ownerUserId, CancellationToken cancellationToken = default);
    Task<List<RemoteAssistSession>> ListPendingAsync(CancellationToken cancellationToken = default);
    Task<(List<RemoteAssistSession> Items, int TotalCount)> ListHistoryAsync(
        long? ownerUserId,
        long? helperUserId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<List<RemoteAssistSession>> ListForSoftDeleteAsync(
        long? ownerUserId,
        long? helperUserId,
        CancellationToken cancellationToken = default);

    Task InsertAsync(RemoteAssistSession session, CancellationToken cancellationToken = default);
}
