using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

internal static class PromotionalVideoPublicAccess
{
    public static bool IsPubliclyVisible(TeacherPromotionalVideo video, Teacher? teacher) =>
        TeacherContentPublicAccess.IsPromotionalVideoPubliclyVisible(video, teacher);
}
