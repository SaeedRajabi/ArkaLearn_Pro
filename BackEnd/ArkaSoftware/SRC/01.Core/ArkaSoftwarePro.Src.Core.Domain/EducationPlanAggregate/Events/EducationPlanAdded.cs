using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Events
{
    public record EducationPlanAdded(string Title, int HourlyRate, int TotalHours, decimal TotalCost, string Description):IDomainEvent { }
}
