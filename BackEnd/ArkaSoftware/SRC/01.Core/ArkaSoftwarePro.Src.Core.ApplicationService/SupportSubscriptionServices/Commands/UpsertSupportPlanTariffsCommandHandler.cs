using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.UpsertSupportPlanTariffs;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.Commands;

public class UpsertSupportPlanTariffsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IStudentSupportSubscriptionRepository repository)
    : CommandHandler<UpsertSupportPlanTariffsCommand, string>(outer)
{
    private static readonly HashSet<int> AllowedDurations = [1, 3, 6];

    public override async Task<CommandResult<string>> Handle(UpsertSupportPlanTariffsCommand command)
    {
        var items = command.Tariffs?
            .Where(t => AllowedDurations.Contains(t.DurationMonths))
            .Select(t => (
                t.DurationMonths,
                Math.Max(0, t.PriceToman),
                t.IsActive,
                (IReadOnlyList<(string Code, bool IsOffered, long AddonPriceToman)>)(t.Features?
                    .Where(f => !string.IsNullOrWhiteSpace(f.FeatureCode))
                    .Select(f => (f.FeatureCode.Trim(), f.IsOffered, Math.Max(0, f.AddonPriceToman)))
                    .ToList() ?? [])))
            .ToList() ?? [];

        if (items.Count == 0)
            return await ResultAsync("No valid tariffs provided.", ApplicationServiceStatus.ValidationError);

        await repository.EnsureDefaultTariffsAsync();
        await repository.UpsertTariffsAsync(items);
        await repository.CommitAsync();
        return await OkAsync("Support plan tariffs saved.");
    }
}
