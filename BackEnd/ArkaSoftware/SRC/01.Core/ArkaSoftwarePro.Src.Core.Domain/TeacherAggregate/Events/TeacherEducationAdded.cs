using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events
{
    public record TeacherEducationAdded(string NameOfInstitutionOrUniversity, TeacherDegreeTypes TypeOfDegree) : IDomainEvent { }
}
