using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events
{
    /// <summary>
    /// رویداد پرداخت کامل فاکتور
    /// </summary>
    public class InvoicePaid : IDomainEvent
    {
        public long InvoiceId { get; }
        public string InvoiceNumber { get; }
        public decimal PaidAmount { get; }
        public DateTime PaidAt { get; }

        public InvoicePaid(long invoiceId, string invoiceNumber, decimal paidAmount)
        {
            InvoiceId = invoiceId;
            InvoiceNumber = invoiceNumber;
            PaidAmount = paidAmount;
            PaidAt = DateTime.UtcNow;
        }
    }
}
