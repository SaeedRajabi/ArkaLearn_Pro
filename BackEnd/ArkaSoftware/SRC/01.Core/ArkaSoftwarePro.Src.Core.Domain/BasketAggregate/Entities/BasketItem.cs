using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;

public class BasketItem : Entity
{
    public Course? Course { get; private set; }
    public long CourseId { get; private set; }
    public int? Quantity { get; private set; }

  
    public BasketItem(Course course , int quantity = 1)
    {
        Course = course;
        Quantity = quantity;
    }

    public BasketItem()
    {
            
    }

    public void IncrementQuantity(int quantity)
    {
        Quantity += quantity;
    }
}