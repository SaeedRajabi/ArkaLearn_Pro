using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;

public sealed class EducationPlanConsumptionService(IEducationPlanCommandRepository planRepository)
    : IEducationPlanConsumptionService
{
    public async Task ApplyRoomSessionEndedAsync(
        long roomId,
        long roomSessionId,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        bool isIgnored,
        CancellationToken cancellationToken = default)
    {
        if (isIgnored || roomId <= 0 || roomSessionId <= 0)
            return;

        var durationMinutes = (int)Math.Ceiling((endTimeUtc - startTimeUtc).TotalMinutes);
        if (durationMinutes <= 0)
            return;

        var plans = await planRepository.GetActivePlansForRoomAtAsync(roomId, startTimeUtc, cancellationToken);
        if (plans.Count == 0)
            return;

        // One deduction per student: if several plans overlap, consume the earliest-started plan first.
        var plansToCharge = plans
            .Where(p => p.ManagedRoomStudentId > 0)
            .GroupBy(p => p.ManagedRoomStudentId)
            .Select(g => g.OrderBy(p => p.StartDateUtc).ThenBy(p => p.Id).First())
            .ToList();

        if (plansToCharge.Count == 0 && plans.Count == 1)
            plansToCharge.Add(plans[0]);

        var changed = false;
        foreach (var plan in plansToCharge)
        {
            if (plan.TryConsumeSessionMinutes(roomSessionId, durationMinutes))
                changed = true;
        }

        if (changed)
            await planRepository.CommitAsync();
    }
}
