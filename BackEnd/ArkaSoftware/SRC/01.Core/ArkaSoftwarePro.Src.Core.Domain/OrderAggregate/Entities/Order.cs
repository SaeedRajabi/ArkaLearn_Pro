using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities
{
    public class Order:AggregateRoot
    {
        #region Properties
        public OrderStatus Status { get; private set; }

        #endregion

        #region References

        private readonly List<OrderItem> _orderItems = new();
        public IReadOnlyList<OrderItem> OrderItems => _orderItems.AsReadOnly();

        public Student? Student { get; private set; }
        public long StudentId { get; private set; }


        #endregion

        #region CTORs

        public Order(Student student)
        {
            Student = student;
            Status = OrderStatus.PROCESSING;
            AddEvent(new OrderAdded(student.UserId));
        }


        public Order()
        {

        }

        #endregion

        #region Behaviors IMP

        // رفتارها

        public void AddOrderItem(OrderItem orderItem)
        {
            var orderItemExist = _orderItems.Exists(x => x.Id == orderItem.Id);
            if (orderItemExist)
                throw new InvalidEntityStateException("OrderItem Is Exist.", nameof(OrderItems));
            _orderItems.Add(orderItem);
            AddEvent(new OrderItemAdded(orderItem.CourseId , orderItem.UnitPrice!.Amount , orderItem.Quantity));
        }
        public void UpdateStatus(OrderStatus status)
        {
            Status = status;
            AddEvent(new OrderStatusUpdated(Id , status));
        }

        public void AddStudent(Student student)
        {
            Student = student;
            StudentId = student.Id;
            AddEvent(new StudentAddedToOrder(Id , student.Id));
        }
        #endregion

    }
}
