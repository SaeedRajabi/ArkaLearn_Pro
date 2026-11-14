using ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UserFiles.Repositories;

public class UserFileCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<UserFile, ArkaSoftwareCommandDbContext>(dbContext), IUserFileCommandRepository
{
    public Task<UserFile?> GetByIdAndUserIdAsync(long fileId, long userId) =>
        _dbContext.Set<UserFile>()
            .FirstOrDefaultAsync(x => x.Id == fileId && x.UserId == userId);

    public Task<List<UserFile>> GetAllByUserIdAsync(long userId) =>
        _dbContext.Set<UserFile>()
            .Where(x => x.UserId == userId)
            .ToListAsync();

    public Task<bool> ExistsSiblingWithNameAsync(
        long userId,
        long? parentId,
        string name,
        long? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = (name ?? string.Empty).Trim().ToLower();
        if (string.IsNullOrEmpty(normalized))
            return Task.FromResult(false);

        var query = _dbContext.Set<UserFile>()
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.ParentId == parentId);

        if (excludeId is > 0)
            query = query.Where(x => x.Id != excludeId.Value);

        return query.AnyAsync(x => x.Name.ToLower() == normalized, cancellationToken);
    }
}
