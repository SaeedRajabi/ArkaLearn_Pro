using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;

internal static class EducationPlanPaymentMapper
{
    public static EducationPlanPaymentType ParsePaymentType(string? raw) =>
        raw?.Trim().ToLowerInvariant() switch
        {
            "installment" or "ghest" or "installments" => EducationPlanPaymentType.Installment,
            _ => EducationPlanPaymentType.Cash,
        };

    public static string MapPaymentType(EducationPlanPaymentType type) =>
        type == EducationPlanPaymentType.Installment ? "installment" : "cash";

    public static List<(int Number, DateTime DueDateUtc, decimal AmountToman)> MapInstallments(
        IEnumerable<EducationPlanInstallmentDto>? installments) =>
        (installments ?? [])
            .Where(i => i.InstallmentNumber > 0 && i.AmountToman > 0)
            .Select(i => (i.InstallmentNumber, i.DueDateUtc, i.AmountToman))
            .ToList();

    public static void ValidateInstallmentSchedule(
        EducationPlanPaymentType paymentType,
        decimal baseTotalToman,
        IReadOnlyList<(int Number, DateTime DueDateUtc, decimal AmountToman)> installments)
    {
        if (paymentType != EducationPlanPaymentType.Installment)
            return;

        if (installments.Count == 0)
            throw new ArgumentException("At least one installment is required.");

        var finalTotal = EducationPlanInstallmentPricing.ApplyInstallmentMarkup(baseTotalToman);
        var sum = installments.Sum(i => i.AmountToman);
        if (Math.Abs(sum - finalTotal) > 1m)
            throw new ArgumentException($"Installment amounts must sum to {finalTotal:N0} Toman (base + 25% markup).");
    }
}
