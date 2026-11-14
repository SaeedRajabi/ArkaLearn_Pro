using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events;

public record TeachingProfileAdded(List<TeacherExpertiseArea> ExpertiseAreas , List<TeacherEducation> TeacherEducations):IDomainEvent{}