using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events
{
    public record ExpertiseAdded(string ExpertiseName, int Rate) : IDomainEvent { }
}
