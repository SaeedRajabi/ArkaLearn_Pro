using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;

public class DiscountCodeCourseTarget : Entity
{
    public long DiscountCodeId { get; private set; }
    public long CourseId { get; private set; }

    private DiscountCodeCourseTarget()
    {
    }

    public DiscountCodeCourseTarget(long courseId)
    {
        if (courseId <= 0)
            throw new ArgumentOutOfRangeException(nameof(courseId));
        CourseId = courseId;
    }
}
