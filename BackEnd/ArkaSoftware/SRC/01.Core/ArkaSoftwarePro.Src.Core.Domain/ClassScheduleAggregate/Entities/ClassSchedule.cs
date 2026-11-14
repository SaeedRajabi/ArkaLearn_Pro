using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ClassScheduleAggregate.Entities
{
    public class ClassSchedule:AggregateRoot
    {


        public long StudentId { get; private set; }
        public Student? Student { get; private set; }
    }
}
