using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events
{
    public record TeacherAdded(long UserId , string LongDescription) : IDomainEvent { }
}
