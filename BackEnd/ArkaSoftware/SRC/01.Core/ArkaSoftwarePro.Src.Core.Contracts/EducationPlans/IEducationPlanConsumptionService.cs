namespace ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;

public interface IEducationPlanConsumptionService
{
    /// <summary>
    /// Deducts completed session duration from active education plans linked to the room.
    /// </summary>
    Task ApplyRoomSessionEndedAsync(
        long roomId,
        long roomSessionId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        bool isIgnored,
        CancellationToken cancellationToken = default);
}
