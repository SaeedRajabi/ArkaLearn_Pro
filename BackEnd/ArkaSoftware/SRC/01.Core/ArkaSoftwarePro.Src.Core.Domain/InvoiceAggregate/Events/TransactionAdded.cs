using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events
{
    /// <summary>
    /// رویداد افزودن تراکنش به فاکتور
    /// </summary>
    public class TransactionAdded : IDomainEvent
    {
        public long InvoiceId { get; }
        public long TransactionId { get; }
        public decimal Amount { get; }
        public DateTime AddedAt { get; }

        public TransactionAdded(long invoiceId, long transactionId, decimal amount)
        {
            InvoiceId = invoiceId;
            TransactionId = transactionId;
            Amount = amount;
            AddedAt = DateTime.UtcNow;
        }
    }
}
