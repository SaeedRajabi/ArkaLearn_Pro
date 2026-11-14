using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;

public static class EducationPlanInstallmentPricing
{
    public static decimal ApplyInstallmentMarkup(decimal baseTotalToman) =>
        Math.Round(baseTotalToman * (1m + EducationPlanInstallment.InstallmentMarkupPercent / 100m), 0);
}
