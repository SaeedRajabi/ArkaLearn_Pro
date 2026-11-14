using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessBlocks;

public class GetDesktopAccessBlocksQuery : IQuery<List<DesktopAccessBlockAdminQri>>
{
    public long? UserId { get; set; }
    public bool ActiveOnly { get; set; } = true;
    public int Take { get; set; } = 100;
}

public class DesktopAccessBlockAdminQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public DesktopBlockScope Scope { get; set; }
    public string? Reason { get; set; }
    public DateTime BlockedAtUtc { get; set; }
    public DateTime? UnblockedAtUtc { get; set; }
    public bool IsActive { get; set; }
}
