using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events
{
    /// <summary>
    /// رویداد صادر شدن فاکتور
    /// </summary>
    public class InvoiceIssued : IDomainEvent
    {
        public long InvoiceId { get; }
        public string InvoiceNumber { get; }
        public DateTime IssuedAt { get; }

        public InvoiceIssued(long invoiceId, string invoiceNumber)
        {
            InvoiceId = invoiceId;
            InvoiceNumber = invoiceNumber;
            IssuedAt = DateTime.UtcNow;
        }
    }
}
