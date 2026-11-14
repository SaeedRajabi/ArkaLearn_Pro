using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events
{
    /// <summary>
    /// رویداد لغو فاکتور
    /// </summary>
    public class InvoiceCancelled : IDomainEvent
    {
        public long InvoiceId { get; }
        public string InvoiceNumber { get; }
        public string? Reason { get; }
        public DateTime CancelledAt { get; }

        public InvoiceCancelled(long invoiceId, string invoiceNumber, string? reason = null)
        {
            InvoiceId = invoiceId;
            InvoiceNumber = invoiceNumber;
            Reason = reason;
            CancelledAt = DateTime.UtcNow;
        }
    }
}
