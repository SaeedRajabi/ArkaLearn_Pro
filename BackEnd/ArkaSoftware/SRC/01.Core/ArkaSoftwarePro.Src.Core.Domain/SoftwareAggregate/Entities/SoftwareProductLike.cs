using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;

public class SoftwareProductLike : Entity
{
    public long SoftwareProductId { get; private set; }
    public SoftwareProduct? SoftwareProduct { get; private set; }
    public long UserId { get; private set; }

    private SoftwareProductLike() { }

    public static SoftwareProductLike Create(long softwareProductId, long userId) =>
        new() { SoftwareProductId = softwareProductId, UserId = userId };
}
