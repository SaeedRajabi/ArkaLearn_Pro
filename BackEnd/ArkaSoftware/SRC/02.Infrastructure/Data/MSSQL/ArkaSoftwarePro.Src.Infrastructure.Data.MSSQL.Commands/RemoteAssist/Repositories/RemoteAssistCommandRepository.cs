using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist.RemoteAssistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.RemoteAssist.Repositories;

public class RemoteAssistCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<RemoteAssistSession, ArkaSoftwareCommandDbContext>(dbContext), IRemoteAssistCommandRepository
{
    public Task<RemoteAssistSession?> GetByIdAsync(long sessionId, CancellationToken cancellationToken = default) =>
        _dbContext.RemoteAssistSessions
            .FirstOrDefaultAsync(x => x.Id == sessionId && !x.IsDelete, cancellationToken);

    public Task<RemoteAssistSession?> GetByCodeAsync(string oneTimeSessionCode, CancellationToken cancellationToken = default) =>
        _dbContext.RemoteAssistSessions
            .FirstOrDefaultAsync(
                x => x.OneTimeSessionCode == oneTimeSessionCode && !x.IsDelete,
                cancellationToken);

    public Task<RemoteAssistSession?> GetOpenByCodeAsync(string oneTimeSessionCode, CancellationToken cancellationToken = default) =>
        _dbContext.RemoteAssistSessions
            .Where(x => !x.IsDelete
                && x.OneTimeSessionCode == oneTimeSessionCode
                && (x.Status == RemoteAssistSessionStatus.Pending
                    || x.Status == RemoteAssistSessionStatus.AwaitingConsent
                    || x.Status == RemoteAssistSessionStatus.Active))
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<RemoteAssistSession?> GetOpenSessionForUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        var sessions = await _dbContext.RemoteAssistSessions
            .Where(x => !x.IsDelete
                && (x.RequesterUserId == userId || x.AcceptedByTeacherUserId == userId)
                && (x.Status == RemoteAssistSessionStatus.Pending
                    || x.Status == RemoteAssistSessionStatus.AwaitingConsent
                    || x.Status == RemoteAssistSessionStatus.Active))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return sessions.FirstOrDefault();
    }

    public async Task<RemoteAssistSession?> GetOpenSessionForOwnerAsync(long ownerUserId, CancellationToken cancellationToken = default)
    {
        var sessions = await _dbContext.RemoteAssistSessions
            .Where(x => !x.IsDelete
                && x.RequesterUserId == ownerUserId
                && (x.Status == RemoteAssistSessionStatus.Pending
                    || x.Status == RemoteAssistSessionStatus.AwaitingConsent
                    || x.Status == RemoteAssistSessionStatus.Active))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return sessions.FirstOrDefault();
    }

    public Task<List<RemoteAssistSession>> ListPendingAsync(CancellationToken cancellationToken = default) =>
        _dbContext.RemoteAssistSessions
            .Where(x => !x.IsDelete && x.Status == RemoteAssistSessionStatus.Pending)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<(List<RemoteAssistSession> Items, int TotalCount)> ListHistoryAsync(
        long? ownerUserId,
        long? helperUserId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var page = Math.Max(1, pageNumber);
        var size = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.RemoteAssistSessions.AsNoTracking().Where(x => !x.IsDelete);
        if (ownerUserId is > 0)
            query = query.Where(x => x.RequesterUserId == ownerUserId.Value);
        if (helperUserId is > 0)
            query = query.Where(x => x.AcceptedByTeacherUserId == helperUserId.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<List<RemoteAssistSession>> ListForSoftDeleteAsync(
        long? ownerUserId,
        long? helperUserId,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.RemoteAssistSessions.Where(x => !x.IsDelete);
        if (ownerUserId is > 0)
            query = query.Where(x => x.RequesterUserId == ownerUserId.Value);
        if (helperUserId is > 0)
            query = query.Where(x => x.AcceptedByTeacherUserId == helperUserId.Value);

        return await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task InsertAsync(RemoteAssistSession session, CancellationToken cancellationToken = default)
    {
        await _dbContext.RemoteAssistSessions.AddAsync(session, cancellationToken);
    }
}
