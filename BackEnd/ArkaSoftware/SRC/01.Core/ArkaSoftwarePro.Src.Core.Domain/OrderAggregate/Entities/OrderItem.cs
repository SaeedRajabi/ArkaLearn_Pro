using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;

public class OrderItem : Entity
{

    #region Properties

    public OrderMoney? UnitPrice { get; private set; }
    public int Quantity { get; private set; }


    
    #endregion


    #region References
    public Course? Course { get; private set; }
    public long CourseId { get; private set; }

    #endregion

    #region CTORs

    public OrderItem( long courseId ,OrderMoney unitPrice, int quantity)
    {
        CourseId = courseId;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }

    public OrderItem()
    {

    }

    #endregion


    #region Behaviors IMP
    // رفتارها
    public decimal TotalPrice => (UnitPrice!.Amount * Quantity);

    public int TotalQuantity => Quantity += Quantity;
    #endregion

}