using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;

public interface IUserFileCommandRepository : ICommandRepository<UserFile, long>
{
    Task<UserFile?> GetByIdAndUserIdAsync(long fileId, long userId);
    Task<List<UserFile>> GetAllByUserIdAsync(long userId);

    /// <summary>
    /// True when another item in the same parent already uses this name (case-insensitive).
    /// </summary>
    Task<bool> ExistsSiblingWithNameAsync(
        long userId,
        long? parentId,
        string name,
        long? excludeId = null,
        CancellationToken cancellationToken = default);
}