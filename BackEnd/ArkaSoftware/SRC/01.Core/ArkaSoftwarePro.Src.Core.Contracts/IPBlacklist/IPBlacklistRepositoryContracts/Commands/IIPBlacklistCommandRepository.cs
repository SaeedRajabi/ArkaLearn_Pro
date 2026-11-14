using IPBlacklistEntity = ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities.IPBlacklist;

namespace ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Commands;

public interface IIPBlacklistCommandRepository
{
    Task<IPBlacklistEntity?> GetAsync(long id);
    Task<IPBlacklistEntity?> GetActiveByIpAsync(string ipAddress);
    Task InsertEntryAsync(IPBlacklistEntity entry);
    Task CommitAsync();
}
