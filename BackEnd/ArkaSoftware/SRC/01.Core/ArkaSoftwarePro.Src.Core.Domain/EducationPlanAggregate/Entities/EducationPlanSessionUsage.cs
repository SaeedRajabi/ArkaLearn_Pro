using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;

public class EducationPlanSessionUsage : Entity
{
    public long EducationPlanId { get; private set; }
    public long RoomSessionId { get; private set; }
    public int MinutesConsumed { get; private set; }
    public DateTime ConsumedAtUtc { get; private set; }

    private EducationPlanSessionUsage() { }

    public static EducationPlanSessionUsage Create(long educationPlanId, long roomSessionId, int minutesConsumed)
    {
        return new EducationPlanSessionUsage
        {
            EducationPlanId = educationPlanId,
            RoomSessionId = roomSessionId,
            MinutesConsumed = minutesConsumed,
            ConsumedAtUtc = DateTime.UtcNow,
        };
    }
}
