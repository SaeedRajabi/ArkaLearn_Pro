using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;

public sealed class IPBlacklistListItemQri
{
    public long Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceInformation { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime AddedDate { get; set; }
    public DateTime ExpirationDate { get; set; }
    public bool IsPermanent { get; set; }
}

public interface IIPBlacklistQueryRepository : IQueryRepository
{
    Task<bool> IsIpBlockedAsync(string ipAddress, CancellationToken cancellationToken = default);
    Task<PagedData<IPBlacklistListItemQri>?> SearchAsync(string? inputValue, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
