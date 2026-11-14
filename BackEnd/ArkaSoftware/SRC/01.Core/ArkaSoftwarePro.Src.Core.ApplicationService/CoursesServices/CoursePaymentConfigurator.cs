using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourses;
using Newtonsoft.Json;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public static class CoursePaymentConfigurator
{
    public static bool TryApply(
        Course course,
        string? paymentTypeRaw,
        string? installmentPlansJson,
        out string? error)
    {
        error = null;
        var paymentType = ParsePaymentType(paymentTypeRaw);
        try
        {
            if (paymentType == CoursePaymentType.Cash)
            {
                course.ConfigurePayment(CoursePaymentType.Cash, null);
                return true;
            }

            var plans = DeserializePlans(installmentPlansJson);
            if (plans.Count == 0)
            {
                error = "Installment schedule is required for installment courses.";
                return false;
            }

            course.ConfigurePayment(
                CoursePaymentType.Installment,
                plans.Select(p => (p.InstallmentNumber, p.AmountToman, p.DueDateUtc)).ToList());
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    public static CoursePaymentType ParsePaymentType(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return CoursePaymentType.Cash;
        return raw.Trim().ToLowerInvariant() switch
        {
            "installment" or "اقساطی" or "1" => CoursePaymentType.Installment,
            _ => CoursePaymentType.Cash,
        };
    }

    public static List<CourseInstallmentPlanDto> DeserializePlans(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonConvert.DeserializeObject<List<CourseInstallmentPlanDto>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
