using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events
{
    /// <summary>
    /// رویداد ایجاد فاکتور
    /// </summary>
    public class InvoiceCreated : IDomainEvent
    {
        public string InvoiceNumber { get; }
        public long OrderId { get; }
        public long StudentId { get; }
        public decimal TotalAmount { get; }
        public DateTime CreatedAt { get; }

        public InvoiceCreated(string invoiceNumber, long orderId, long studentId, decimal totalAmount)
        {
            InvoiceNumber = invoiceNumber;
            OrderId = orderId;
            StudentId = studentId;
            TotalAmount = totalAmount;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
